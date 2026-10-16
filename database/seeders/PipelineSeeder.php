<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Database\Seeder;

class PipelineSeeder extends Seeder
{
    public function run(): void
    {
        $sales = User::query()->where('email', 'sales@globeflight.co.ke')->first();
        if (! $sales) {
            return;
        }

        $customer = Customer::query()->first();
        if (! $customer) {
            $customer = Customer::query()->create([
                'name' => 'Demo Pipeline Customer',
                'email' => 'pipeline-demo@example.com',
                'phone' => '+254700000099',
                'country' => 'Kenya',
                'status' => 'lead',
                'assigned_salesperson_id' => $sales->id,
            ]);
        }

        Opportunity::query()->updateOrCreate(
            ['reference' => 'OP-DEMO-0001'],
            [
                'title' => 'Air freight Nairobi–Dubai',
                'customer_id' => $customer->id,
                'owner_id' => $sales->id,
                'created_by' => $sales->id,
                'stage' => 'contacted',
                'expected_value' => 185000,
                'currency' => 'KES',
                'next_follow_up' => now()->addDays(2)->toDateString(),
                'notes' => 'Demo opportunity seeded for sales pipeline walkthrough.',
            ]
        );

        Opportunity::query()->updateOrCreate(
            ['reference' => 'OP-DEMO-0002'],
            [
                'title' => 'Sea LCL Mombasa import',
                'customer_id' => $customer->id,
                'owner_id' => $sales->id,
                'created_by' => $sales->id,
                'stage' => 'negotiation',
                'expected_value' => 420000,
                'currency' => 'KES',
                'next_follow_up' => now()->subDay()->toDateString(),
                'notes' => 'Overdue follow-up demo deal.',
            ]
        );
    }
}
