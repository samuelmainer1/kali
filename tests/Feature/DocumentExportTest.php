<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        Storage::fake(config('filesystems.documents_disk'));
    }

    public function test_staff_can_download_the_company_profile_pdf(): void
    {
        $user = User::factory()->create();
        $user->assignRole('sales');

        $response = $this->actingAs($user)->get(route('documents.company-profile'));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
        Storage::disk(config('filesystems.documents_disk'))->assertExists('company/profile.pdf');
    }

    public function test_administrator_can_download_the_staff_spreadsheet(): void
    {
        $user = User::factory()->create(['name' => 'Export Admin']);
        $user->assignRole('administrator');

        $response = $this->actingAs($user)->get(route('documents.user-directory'));

        $response->assertOk();
        $this->assertStringContainsString(
            'spreadsheetml.sheet',
            (string) $response->headers->get('content-type')
        );
        Storage::disk(config('filesystems.documents_disk'))->assertExists('exports/user-directory.xlsx');
    }

    public function test_customer_cannot_download_the_staff_spreadsheet(): void
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $this->actingAs($user)->get(route('documents.user-directory'))->assertForbidden();
    }

    public function test_queue_is_drained_from_the_scheduler(): void
    {
        $this->artisan('schedule:list')
            ->assertOk()
            ->expectsOutputToContain('queue:work');
    }
}
