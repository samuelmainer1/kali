<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\ItRequest;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_staff_request_is_owned_by_it_and_marketing(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $marketer = User::factory()->create(['name' => 'IT Officer']);
        $marketer->assignRole('marketing');

        $this->actingAs($sales)
            ->post(route('it.requests.store'), [
                'title' => 'Laptop will not start',
                'description' => 'The Nairobi desk laptop shows a black screen.',
                'category' => 'hardware',
                'priority' => 'high',
            ])
            ->assertRedirect();

        $request = ItRequest::query()->first();
        $this->assertNotNull($request);
        $this->assertSame('IT & Marketing', $request->department->name);
        $this->assertSame('MKT', $request->department->code);
        $this->assertStringStartsWith('IT-', $request->reference);
        $this->assertSame($sales->id, $request->user_id);

        $this->actingAs($marketer)
            ->get(route('it.requests.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('It/Index')
                ->where('department.name', 'IT & Marketing')
                ->has('requests.data', 1));

        $this->actingAs($marketer)
            ->put(route('it.requests.update', $request), [
                'status' => 'in_progress',
                'assigned_to' => $marketer->id,
                'resolution' => null,
            ])
            ->assertRedirect();

        $this->assertSame('in_progress', $request->fresh()->status);
        $this->assertSame($marketer->id, $request->fresh()->assigned_to);
    }

    public function test_staff_cannot_open_someone_elses_it_request(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $ops = User::factory()->create();
        $ops->assignRole('operations');

        $department = Department::query()->create([
            'name' => 'IT & Marketing',
            'code' => 'MKT',
            'is_active' => true,
        ]);

        $request = ItRequest::query()->create([
            'reference' => 'IT-2026-0099',
            'user_id' => $ops->id,
            'department_id' => $department->id,
            'category' => 'access',
            'priority' => 'medium',
            'status' => 'open',
            'title' => 'Email access',
            'description' => 'Need the shared inbox.',
        ]);

        $this->actingAs($sales)
            ->get(route('it.requests.show', $request))
            ->assertForbidden();
    }

    public function test_customer_cannot_open_it_requests(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $this->actingAs($customer)
            ->get(route('it.requests.index'))
            ->assertForbidden();
    }
}
