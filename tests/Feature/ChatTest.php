<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Department;
use App\Models\User;
use App\Models\UserNotification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_staff_can_message_one_person_and_continue_the_same_conversation(): void
    {
        $sales = User::factory()->create(['name' => 'Sales Person']);
        $sales->assignRole('sales');
        $ops = User::factory()->create(['name' => 'Ops Person']);
        $ops->assignRole('operations');

        $this->actingAs($sales)
            ->post(route('chat.store'), [
                'audience' => 'person',
                'user_id' => $ops->id,
                'body' => 'Please confirm the Nairobi pickup.',
            ])
            ->assertRedirect();

        $conversation = Conversation::query()->first();
        $this->assertNotNull($conversation);
        $this->assertSame('direct', $conversation->type);

        $this->actingAs($ops)
            ->get(route('chat.show', $conversation))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Chat/Show')
                ->where('conversation.title', 'Sales Person')
                ->has('messages', 1));

        $this->actingAs($ops)
            ->post(route('chat.reply', $conversation), [
                'body' => 'Pickup is confirmed.',
            ])
            ->assertRedirect(route('chat.show', $conversation));

        $this->actingAs($sales)
            ->post(route('chat.store'), [
                'audience' => 'person',
                'user_id' => $ops->id,
                'body' => 'Thank you.',
            ])
            ->assertRedirect(route('chat.show', $conversation));

        $this->assertSame(1, Conversation::query()->count());
        $this->assertSame(3, $conversation->messages()->count());
        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $ops->id,
            'type' => 'chat.message',
        ]);
    }

    public function test_department_message_is_visible_to_that_department_only(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $department = Department::query()->create([
            'name' => 'Warehouse',
            'code' => 'WHS',
            'is_active' => true,
        ]);
        $warehouse = User::factory()->create([
            'name' => 'Warehouse Person',
            'department_id' => $department->id,
        ]);
        $warehouse->assignRole('warehouse');
        $finance = User::factory()->create();
        $finance->assignRole('finance');

        $this->actingAs($sales)
            ->post(route('chat.store'), [
                'audience' => 'department',
                'department_id' => $department->id,
                'body' => 'Need a pallet count.',
            ])
            ->assertRedirect();

        $conversation = Conversation::query()->where('department_id', $department->id)->first();
        $this->assertNotNull($conversation);

        $this->actingAs($warehouse)
            ->get(route('chat.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Chat/Index')
                ->has('conversations', 1)
                ->where('conversations.0.title', 'Warehouse'));

        $this->actingAs($warehouse)
            ->get(route('chat.show', $conversation))
            ->assertOk();

        $this->actingAs($finance)
            ->get(route('chat.show', $conversation))
            ->assertForbidden();

        $this->assertTrue(
            UserNotification::query()->where('user_id', $warehouse->id)->where('type', 'chat.message')->exists()
        );
        $this->assertFalse(
            UserNotification::query()->where('user_id', $finance->id)->where('type', 'chat.message')->exists()
        );
    }

    public function test_customer_cannot_open_chat_or_be_messaged(): void
    {
        $sales = User::factory()->create();
        $sales->assignRole('sales');
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $this->actingAs($customer)
            ->get(route('chat.index'))
            ->assertForbidden();

        $this->actingAs($sales)
            ->post(route('chat.store'), [
                'audience' => 'person',
                'user_id' => $customer->id,
                'body' => 'Hello customer',
            ])
            ->assertSessionHasErrors('user_id');

        $this->actingAs($sales)
            ->post(route('chat.store'), [
                'audience' => 'person',
                'user_id' => $sales->id,
                'body' => 'Hello me',
            ])
            ->assertSessionHasErrors('user_id');
    }
}
