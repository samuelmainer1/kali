<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Quotation;
use App\Models\User;
use App\Services\QuotationService;
use Illuminate\Database\Seeder;

class CrmQuotationSeeder extends Seeder
{
    public function run(): void
    {
        $sales = User::query()->where('email', 'sales@globeflight.co.ke')->first();
        $service = app(QuotationService::class);

        $acme = Customer::query()->updateOrCreate(
            ['email' => 'procurement@acme-africa.com'],
            [
                'name' => 'Acme Africa Ltd',
                'trading_name' => 'Acme Africa',
                'phone' => '+254711000111',
                'country' => 'Kenya',
                'status' => 'active',
                'assigned_salesperson_id' => $sales?->id,
                'notes' => 'Key account for regional distribution.',
            ]
        );

        if ($acme->contacts()->count() === 0) {
            $acme->contacts()->create([
                'name' => 'Jane Wanjiku',
                'email' => 'jane@acme-africa.com',
                'phone' => '+254711000112',
                'job_title' => 'Procurement Lead',
                'is_primary' => true,
            ]);
            $acme->addresses()->create([
                'label' => 'shipping',
                'line1' => 'Industrial Area, Road 12',
                'city' => 'Nairobi',
                'country' => 'Kenya',
                'is_default' => true,
            ]);
        }

        $safari = Customer::query()->updateOrCreate(
            ['email' => 'ops@safaricargo.co.ke'],
            [
                'name' => 'Safari Cargo Partners',
                'trading_name' => 'Safari Cargo',
                'phone' => '+254722333444',
                'country' => 'Kenya',
                'status' => 'lead',
                'assigned_salesperson_id' => $sales?->id,
            ]
        );

        if ($safari->contacts()->count() === 0) {
            $safari->contacts()->create([
                'name' => 'Peter Otieno',
                'email' => 'peter@safaricargo.co.ke',
                'is_primary' => true,
            ]);
        }

        if ($sales && ! Quotation::query()->where('reference', 'like', 'QT-'.now()->format('Y').'-%')->exists()) {
            $totals = $service->calculateTotals([
                [
                    'description' => 'Air freight Nairobi → Dubai (1 CBM)',
                    'quantity' => 1,
                    'unit' => 'shipment',
                    'unit_price' => 85000,
                    'weight_kg' => 120,
                ],
                [
                    'description' => 'Export documentation handling',
                    'quantity' => 1,
                    'unit' => 'service',
                    'unit_price' => 7500,
                ],
            ]);

            $quotation = Quotation::query()->create([
                'reference' => $service->nextReference('QT'),
                'customer_id' => $acme->id,
                'contact_id' => $acme->contacts()->first()?->id,
                'created_by' => $sales->id,
                'status' => 'pending_approval',
                'valid_until' => now()->addDays(14)->toDateString(),
                'currency' => 'KES',
                'subtotal' => $totals['subtotal'],
                'tax_amount' => $totals['tax_amount'],
                'total' => $totals['total'],
                'origin_country' => 'Kenya',
                'destination_country' => 'United Arab Emirates',
                'service_type' => 'air',
                'notes' => 'Demo quotation for Module 3+4.',
                'terms' => 'Payment within 7 days of approval.',
            ]);

            $quotation->items()->createMany($totals['items']);
        }
    }
}
