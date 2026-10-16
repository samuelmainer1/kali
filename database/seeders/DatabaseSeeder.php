<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\CompanySetting;
use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        $departments = [
            ['name' => 'Administration', 'code' => 'ADM', 'description' => 'System and company administration'],
            ['name' => 'Management', 'code' => 'MGT', 'description' => 'Executive and business leadership'],
            ['name' => 'Sales', 'code' => 'SAL', 'description' => 'Business development and quotations'],
            ['name' => 'Operations', 'code' => 'OPS', 'description' => 'Shipment and logistics operations'],
            ['name' => 'Warehouse', 'code' => 'WHS', 'description' => 'Cargo handling and inventory'],
            ['name' => 'Finance', 'code' => 'FIN', 'description' => 'Billing, invoices, and accounts'],
            ['name' => 'Customer Care', 'code' => 'CCR', 'description' => 'Customer support and service'],
            ['name' => 'Marketing', 'code' => 'MKT', 'description' => 'Brand and growth'],
        ];

        foreach ($departments as $department) {
            Department::query()->updateOrCreate(['code' => $department['code']], $department);
        }

        $nairobi = Branch::query()->updateOrCreate(
            ['code' => 'NBO'],
            [
                'name' => 'Nairobi HQ',
                'city' => 'Nairobi',
                'country' => 'Kenya',
                'phone' => '+254 729 341 277',
                'email' => 'cs@globeflight.co.ke',
                'address' => 'Nextgen Mall, 3rd Floor, Suite 39/40. Mombasa Road, Nairobi, Kenya.',
                'is_active' => true,
            ]
        );

        Branch::query()->updateOrCreate(
            ['code' => 'MBA'],
            [
                'name' => 'Mombasa Branch',
                'city' => 'Mombasa',
                'country' => 'Kenya',
                'phone' => '+254 700 000 002',
                'email' => 'mombasa@globeflight.co.ke',
                'address' => 'Mombasa, Kenya',
                'is_active' => true,
            ]
        );

        $settings = CompanySetting::current();
        $settings->fill([
            'email' => 'cs@globeflight.co.ke',
            'phone' => '+254 729 341 277',
            'address' => 'Nextgen Mall, 3rd Floor, Suite 39/40. Mombasa Road, Nairobi, Kenya.',
        ])->save();

        $password = Hash::make('Password1!');

        $users = [
            ['name' => 'System Administrator', 'email' => 'admin@globeflight.co.ke', 'role' => 'administrator', 'dept' => 'ADM', 'code' => 'GF-ADM-001'],
            ['name' => 'Management User', 'email' => 'management@globeflight.co.ke', 'role' => 'management', 'dept' => 'MGT', 'code' => 'GF-MGT-001'],
            ['name' => 'Sales Officer', 'email' => 'sales@globeflight.co.ke', 'role' => 'sales', 'dept' => 'SAL', 'code' => 'GF-SAL-001'],
            ['name' => 'Operations Officer', 'email' => 'operations@globeflight.co.ke', 'role' => 'operations', 'dept' => 'OPS', 'code' => 'GF-OPS-001'],
            ['name' => 'Warehouse Officer', 'email' => 'warehouse@globeflight.co.ke', 'role' => 'warehouse', 'dept' => 'WHS', 'code' => 'GF-WHS-001'],
            ['name' => 'Finance Officer', 'email' => 'finance@globeflight.co.ke', 'role' => 'finance', 'dept' => 'FIN', 'code' => 'GF-FIN-001'],
            ['name' => 'Customer Care Agent', 'email' => 'care@globeflight.co.ke', 'role' => 'customer_care', 'dept' => 'CCR', 'code' => 'GF-CCR-001'],
            ['name' => 'Marketing Officer', 'email' => 'marketing@globeflight.co.ke', 'role' => 'marketing', 'dept' => 'MKT', 'code' => 'GF-MKT-001'],
            ['name' => 'Demo Customer', 'email' => 'customer@example.com', 'role' => 'customer', 'dept' => null, 'code' => null],
        ];

        foreach ($users as $data) {
            $departmentId = $data['dept']
                ? Department::query()->where('code', $data['dept'])->value('id')
                : null;

            $user = User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => $password,
                    'phone' => '+254700000000',
                    'employee_code' => $data['code'],
                    'department_id' => $departmentId,
                    'branch_id' => $data['role'] === 'customer' ? null : $nairobi->id,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            $user->syncRoles([$data['role']]);
        }

        $this->call(CrmQuotationSeeder::class);
        $this->call(AnnouncementSeeder::class);
        $this->call(PipelineSeeder::class);
        $this->call(ProcurementSeeder::class);
        $this->call(LeaveSeeder::class);
    }
}
