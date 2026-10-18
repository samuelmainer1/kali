<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TasksTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_staff_can_create_update_and_comment_on_task(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $ops = User::factory()->create();
        $ops->assignRole('operations');

        $this->actingAs($sales)
            ->post(route('tasks.store'), [
                'title' => 'Follow up ABC Ltd quotation',
                'description' => 'Call regarding quotation follow-up.',
                'priority' => 'high',
                'due_date' => now()->addDays(2)->toDateString(),
                'assigned_to' => $ops->id,
                'department_id' => null,
                'related_key' => null,
                'related_id' => null,
            ])
            ->assertRedirect();

        $task = Task::query()->first();
        $this->assertNotNull($task);
        $this->assertSame('todo', $task->status);
        $this->assertSame($ops->id, $task->assigned_to);
        $this->assertStringStartsWith('TS-', $task->reference);

        $this->actingAs($ops)
            ->post(route('tasks.status', $task), ['status' => 'in_progress'])
            ->assertRedirect();

        $this->actingAs($ops)
            ->post(route('tasks.comment', $task), ['body' => 'Called customer, awaiting reply.'])
            ->assertRedirect();

        $this->assertDatabaseHas('task_comments', [
            'task_id' => $task->id,
            'user_id' => $ops->id,
        ]);

        $this->actingAs($ops)
            ->post(route('tasks.status', $task), ['status' => 'done'])
            ->assertRedirect();

        $this->assertSame('done', $task->fresh()->status);
        $this->assertNotNull($task->fresh()->completed_at);
    }

    public function test_staff_cannot_view_unrelated_tasks_without_manage(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $ops = User::factory()->create();
        $ops->assignRole('operations');
        $care = User::factory()->create();
        $care->assignRole('customer_care');

        $task = Task::query()->create([
            'reference' => 'TS-2026-0001',
            'title' => 'Private ops task',
            'status' => 'todo',
            'priority' => 'medium',
            'assigned_to' => $ops->id,
            'created_by' => $ops->id,
        ]);

        $this->actingAs($care)
            ->get(route('tasks.show', $task))
            ->assertForbidden();

        $manager = User::factory()->create();
        $manager->assignRole('management');

        $this->actingAs($manager)
            ->get(route('tasks.show', $task))
            ->assertOk();
    }
}
