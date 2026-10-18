<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.create') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'department_id' => $this->filled('department_id') ? $this->department_id : null,
            'branch_id' => $this->filled('branch_id') ? $this->branch_id : null,
            'employee_code' => $this->filled('employee_code') ? $this->employee_code : null,
            'phone' => $this->filled('phone') ? $this->phone : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'employee_code' => ['nullable', 'string', 'max:50', 'unique:users,employee_code'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', 'string', Rule::exists(config('permission.table_names.roles'), 'name'), function (string $attribute, mixed $value, \Closure $fail): void {
                if (is_string($value) && str_starts_with($value, 'department:')) {
                    $fail('Choose a staff role. Department privileges are set on the department.');
                }
            }],
            'department_id' => ['nullable', 'exists:departments,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
