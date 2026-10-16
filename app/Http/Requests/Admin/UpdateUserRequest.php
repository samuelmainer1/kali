<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.update') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'department_id' => $this->filled('department_id') ? $this->department_id : null,
            'branch_id' => $this->filled('branch_id') ? $this->branch_id : null,
            'employee_code' => $this->filled('employee_code') ? $this->employee_code : null,
            'phone' => $this->filled('phone') ? $this->phone : null,
            'password' => $this->filled('password') ? $this->password : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['nullable', 'string', 'max:50'],
            'employee_code' => ['nullable', 'string', 'max:50', Rule::unique('users', 'employee_code')->ignore($userId)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role' => ['required', 'string', Rule::exists(config('permission.table_names.roles'), 'name')],
            'department_id' => ['nullable', 'exists:departments,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
