<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function index(): Response
    {
        $departments = Department::query()
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn (Department $department) => [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
                'description' => $department->description,
                'is_active' => $department->is_active,
                'users_count' => $department->users_count,
                'is_protected' => $department->code === 'ADM',
            ]);

        return Inertia::render('Admin/Departments/Index', [
            'departments' => $departments,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name'],
            'code' => ['required', 'string', 'max:20', 'unique:departments,code'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['required', 'boolean'],
        ]);

        $department = Department::query()->create($data);

        $this->activityLog->log('departments.created', "Created department {$department->name}", $department);

        return back()->with('success', 'Department created.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        if ($department->code === 'ADM') {
            return back()->with('error', 'The Administration department cannot be edited.');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('departments', 'name')->ignore($department->id)],
            'code' => ['required', 'string', 'max:20', Rule::unique('departments', 'code')->ignore($department->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['required', 'boolean'],
        ]);

        $department->update($data);

        $this->activityLog->log('departments.updated', "Updated department {$department->name}", $department);

        return back()->with('success', 'Department updated.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        if ($department->code === 'ADM') {
            return back()->with('error', 'The Administration department cannot be deleted.');
        }

        if ($department->users()->exists()) {
            return back()->with('error', 'Cannot delete a department that still has users.');
        }

        $name = $department->name;
        $department->delete();

        $this->activityLog->log('departments.deleted', "Deleted department {$name}");

        return back()->with('success', 'Department deleted.');
    }
}
