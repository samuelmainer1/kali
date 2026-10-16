<?php

namespace Database\Seeders;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Services\LeaveService;
use Illuminate\Database\Seeder;

class LeaveSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Annual Leave', 'code' => 'ANNUAL', 'days_per_year' => 21, 'is_paid' => true, 'sort_order' => 1],
            ['name' => 'Sick Leave', 'code' => 'SICK', 'days_per_year' => 14, 'is_paid' => true, 'sort_order' => 2],
            ['name' => 'Compassionate Leave', 'code' => 'COMPASSIONATE', 'days_per_year' => 5, 'is_paid' => true, 'sort_order' => 3],
            ['name' => 'Unpaid Leave', 'code' => 'UNPAID', 'days_per_year' => 30, 'is_paid' => false, 'sort_order' => 4],
        ];

        foreach ($types as $type) {
            LeaveType::query()->updateOrCreate(['code' => $type['code']], $type + ['is_active' => true]);
        }

        $leave = app(LeaveService::class);
        $staff = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', '!=', 'customer'))
            ->get();

        foreach ($staff as $user) {
            foreach (LeaveType::query()->where('is_active', true)->get() as $type) {
                $leave->ensureBalance($user, $type);
            }
        }

        $sales = User::query()->where('email', 'sales@globeflight.co.ke')->first();
        $annual = LeaveType::query()->where('code', 'ANNUAL')->first();

        if ($sales && $annual && ! LeaveRequest::query()->where('user_id', $sales->id)->exists()) {
            $start = now()->copy()->next('Monday');

            $leave->create($sales, [
                'leave_type_id' => $annual->id,
                'start_date' => $start->toDateString(),
                'end_date' => $start->copy()->addWeekdays(2)->toDateString(),
                'is_half_day' => false,
                'reason' => 'Demo annual leave request for management review.',
            ]);
        }
    }
}
