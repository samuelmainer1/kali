<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function index(): Response
    {
        $branches = Branch::query()
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn (Branch $branch) => [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
                'city' => $branch->city,
                'country' => $branch->country,
                'phone' => $branch->phone,
                'email' => $branch->email,
                'address' => $branch->address,
                'is_active' => $branch->is_active,
                'users_count' => $branch->users_count,
            ]);

        return Inertia::render('Admin/Branches/Index', [
            'branches' => $branches,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:20', 'unique:branches,code'],
            'city' => ['nullable', 'string', 'max:120'],
            'country' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['required', 'boolean'],
        ]);

        $branch = Branch::query()->create($data);

        $this->activityLog->log('branches.created', "Created branch {$branch->name}", $branch);

        return back()->with('success', 'Branch created.');
    }

    public function update(Request $request, Branch $branch): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:20', Rule::unique('branches', 'code')->ignore($branch->id)],
            'city' => ['nullable', 'string', 'max:120'],
            'country' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['required', 'boolean'],
        ]);

        $branch->update($data);

        $this->activityLog->log('branches.updated', "Updated branch {$branch->name}", $branch);

        return back()->with('success', 'Branch updated.');
    }

    public function destroy(Branch $branch): RedirectResponse
    {
        if ($branch->users()->exists()) {
            return back()->with('error', 'Cannot delete a branch that still has users.');
        }

        $name = $branch->name;
        $branch->delete();

        $this->activityLog->log('branches.deleted', "Deleted branch {$name}");

        return back()->with('success', 'Branch deleted.');
    }
}
