<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class UserDirectoryExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(private readonly User $viewer) {}

    /**
     * @return Builder<User>
     */
    public function query(): Builder
    {
        return User::query()
            ->visibleTo($this->viewer)
            ->with(['department', 'branch'])
            ->orderBy('name');
    }

    /**
     * @return list<string>
     */
    public function headings(): array
    {
        return ['Name', 'Email', 'Employee code', 'Department', 'Branch', 'Active'];
    }

    /**
     * @param  User  $user
     * @return list<string|null>
     */
    public function map($user): array
    {
        return [
            $user->name,
            $user->email,
            $user->employee_code,
            $user->department?->name,
            $user->branch?->name,
            $user->is_active ? 'Yes' : 'No',
        ];
    }
}
