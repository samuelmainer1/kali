<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationPortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('company.email', 'cs@globeflight.co.ke')
                ->where('company.phone', '+254 729 341 277')
                ->where('company.address', 'Nextgen Mall, 3rd Floor, Suite 39/40. Mombasa Road, Nairobi, Kenya.'));
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_inactive_users_cannot_authenticate(): void
    {
        $user = User::factory()->inactive()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
    }

    public function test_dashboard_is_role_aware_for_administrator(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('administrator');

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Dashboard/Index')
            ->where('role', 'administrator')
            ->has('stats', 9)
            ->where('stats.0.label', 'Total Users')
            ->where('stats.6.label', 'Pending Approvals')
            ->where('stats.8.label', 'Unpaid Invoices'));
    }

    public function test_administrator_and_management_share_the_same_dashboard_cards(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $administrator = User::factory()->create();
        $administrator->assignRole('administrator');

        $management = User::factory()->create();
        $management->assignRole('management');

        $labels = [
            'Total Users',
            'Active Shipments',
            'Quotations',
            'Pending Reports',
            'Customers',
            'Invoices Paid',
            'Pending Approvals',
            'Pipeline Value',
            'Unpaid Invoices',
        ];

        $administratorStats = null;
        $managementStats = null;

        $this->actingAs($administrator)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(function ($page) use (&$administratorStats, $labels) {
                $page->where('role', 'administrator')
                    ->where('stats.0.label', $labels[0])
                    ->where('stats.8.label', $labels[8]);

                $administratorStats = $page->toArray()['props']['stats'];
            });

        $this->actingAs($management)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(function ($page) use (&$managementStats) {
                $page->where('role', 'management');
                $managementStats = $page->toArray()['props']['stats'];
            });

        $this->assertSame($labels, array_column($administratorStats, 'label'));
        $this->assertSame($administratorStats, $managementStats);
    }
}
