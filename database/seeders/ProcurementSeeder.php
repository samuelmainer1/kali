<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProcurementSeeder extends Seeder
{
    public function run(): void
    {
        $marketer = User::query()->where('email', 'marketing@globeflight.co.ke')->first();
        if (! $marketer) {
            return;
        }

        $deptId = $marketer->department_id
            ?: Department::query()->where('code', 'MKT')->value('id');

        $request = PurchaseRequest::query()->updateOrCreate(
            ['reference' => 'PR-DEMO-0001'],
            [
                'title' => 'Marketing tripod',
                'justification' => 'Needed for client content shoots and branch promotions.',
                'status' => 'submitted',
                'department_id' => $deptId,
                'requested_by' => $marketer->id,
                'total_amount' => 8000,
                'currency' => 'KES',
            ]
        );

        $request->items()->delete();
        PurchaseRequestItem::query()->create([
            'purchase_request_id' => $request->id,
            'description' => 'Tripod',
            'quantity' => 1,
            'unit_cost' => 8000,
            'line_total' => 8000,
        ]);
    }
}
