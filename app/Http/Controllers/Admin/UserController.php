<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Branch;
use App\Models\Department;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function index(Request $request): Response
    {
        $users = User::query()
            ->with(['department:id,name', 'branch:id,name', 'roles:id,name'])
            ->when($request->string('search')->toString(), function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('employee_code', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('role'), fn ($q) => $q->role($request->string('role')->toString()))
            ->when($request->filled('department_id'), fn ($q) => $q->where('department_id', $request->integer('department_id')))
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('is_active', $request->string('status')->toString() === 'active');
            })
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'employee_code' => $user->employee_code,
                'is_active' => $user->is_active,
                'role' => $user->primaryRole(),
                'department' => $user->department?->name,
                'branch' => $user->branch?->name,
                'last_login_at' => $user->last_login_at?->diffForHumans(),
                'is_protected' => $user->hasRole('administrator'),
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'department_id', 'status']),
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Users/Form', [
            'user' => null,
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'departments' => Department::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'branches' => Branch::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $role = $data['role'];
        unset($data['role']);

        if ($role === 'administrator' && ! $request->user()->hasRole('administrator')) {
            abort(403, 'Only an administrator can assign the administrator role.');
        }

        $data['password'] = Hash::make($data['password']);
        $data['email_verified_at'] = now();

        $user = User::query()->create($data);
        $user->syncRoles([$role]);

        $this->activityLog->log('users.created', "Created user {$user->name}", $user, [
            'email' => $user->email,
            'role' => $role,
        ]);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function edit(Request $request, User $user): Response
    {
        $this->guardAdministratorUser($user);

        $user->load(['roles:id,name']);

        return Inertia::render('Admin/Users/Form', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'employee_code' => $user->employee_code,
                'department_id' => $user->department_id,
                'branch_id' => $user->branch_id,
                'is_active' => $user->is_active,
                'role' => $user->primaryRole(),
            ],
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name', 'is_active']),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name', 'is_active']),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->guardAdministratorUser($user);

        $data = $request->validated();
        $role = $data['role'];
        unset($data['role']);

        if ($role === 'administrator' && ! $request->user()->hasRole('administrator')) {
            abort(403, 'Only an administrator can assign the administrator role.');
        }

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        $user->syncRoles([$role]);

        $this->activityLog->log('users.updated', "Updated user {$user->name}", $user, [
            'role' => $role,
        ]);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function toggleActive(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->can('users.update'), 403);

        if ($user->hasRole('administrator')) {
            return back()->with('error', 'Administrator accounts cannot be activated or deactivated here.');
        }

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        $user->update(['is_active' => ! $user->is_active]);

        $this->activityLog->log(
            $user->is_active ? 'users.activated' : 'users.deactivated',
            ($user->is_active ? 'Activated' : 'Deactivated')." user {$user->name}",
            $user,
        );

        return back()->with('success', 'User status updated.');
    }

    private function guardAdministratorUser(User $user): void
    {
        if ($user->hasRole('administrator')) {
            abort(403, 'Administrator accounts cannot be edited.');
        }
    }
}
