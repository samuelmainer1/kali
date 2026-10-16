<?php

namespace App\Http\Controllers\Announcements;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Department;
use App\Services\AnnouncementService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function __construct(private readonly AnnouncementService $announcements) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($this->announcements->canView($user), 403);

        $canManage = $user->can('announcements.manage');

        $query = Announcement::query()
            ->with(['creator:id,name', 'department:id,name,code'])
            ->latest('published_at')
            ->latest('id');

        if (! $canManage) {
            $query->active()->visibleTo($user);
        } else {
            if ($request->filled('type')) {
                $query->where('type', $request->string('type'));
            }

            if ($request->filled('status')) {
                $now = now();
                match ((string) $request->string('status')) {
                    'active' => $query->where('is_published', true)
                        ->where(fn ($q) => $q->whereNull('published_at')->orWhere('published_at', '<=', $now))
                        ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', $now)),
                    'scheduled' => $query->where('is_published', true)->where('published_at', '>', $now),
                    'expired' => $query->whereNotNull('expires_at')->where('expires_at', '<=', $now),
                    'draft' => $query->where('is_published', false),
                    default => null,
                };
            }
        }

        if ($request->filled('q')) {
            $q = $request->string('q');
            $query->where(fn ($builder) => $builder
                ->where('title', 'like', "%{$q}%")
                ->orWhere('reference', 'like', "%{$q}%"));
        }

        $announcements = $query->paginate(20)->withQueryString();

        $readIds = $user->announcementReads()
            ->whereIn('announcement_id', $announcements->getCollection()->pluck('id'))
            ->pluck('announcement_id')
            ->all();

        $announcements->getCollection()->transform(function (Announcement $item) use ($readIds) {
            $item->setAttribute('is_read', in_array($item->id, $readIds, true));
            $item->setAttribute(
                'audience_label',
                $item->department?->name ?: 'All employees'
            );

            return $item;
        });

        return Inertia::render('Announcements/Index', [
            'announcements' => $announcements,
            'filters' => $request->only(['q', 'type', 'status']),
            'canManage' => $canManage,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Announcements/Form', [
            'announcement' => null,
            'departments' => Department::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'types' => Announcement::TYPES,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $announcement = $this->announcements->create($request->user(), $data);

        return redirect()
            ->route('announcements.show', $announcement)
            ->with('success', 'Announcement published.');
    }

    public function show(Request $request, Announcement $announcement): Response
    {
        $user = $request->user();
        abort_unless($this->announcements->canView($user), 403);

        $canManage = $user->can('announcements.manage');

        if (! $canManage && ! $announcement->isVisibleTo($user)) {
            abort(404);
        }

        $this->announcements->markRead($announcement, $user);
        $announcement->load(['creator:id,name', 'department:id,name,code']);
        $announcement->setAttribute(
            'audience_label',
            $announcement->department?->name ?: 'All employees'
        );

        return Inertia::render('Announcements/Show', [
            'announcement' => $announcement,
            'canManage' => $canManage,
        ]);
    }

    public function edit(Announcement $announcement): Response
    {
        return Inertia::render('Announcements/Form', [
            'announcement' => $announcement->load(['department:id,name,code']),
            'departments' => Department::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'types' => Announcement::TYPES,
        ]);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $data = $this->validated($request);
        $this->announcements->update($announcement, $data);

        return redirect()
            ->route('announcements.show', $announcement)
            ->with('success', 'Announcement updated.');
    }

    public function markRead(Request $request, Announcement $announcement)
    {
        abort_unless($this->announcements->canView($request->user()), 403);

        if (! $request->user()->can('announcements.manage') && ! $announcement->isVisibleTo($request->user())) {
            abort(404);
        }

        $this->announcements->markRead($announcement, $request->user());

        return back()->with('success', 'Marked as read.');
    }

    private function validated(Request $request): array
    {
        $request->merge([
            'department_id' => $request->filled('department_id') ? $request->input('department_id') : null,
            'published_at' => $request->filled('published_at') ? $request->input('published_at') : null,
            'expires_at' => $request->filled('expires_at') ? $request->input('expires_at') : null,
            'is_urgent' => $request->boolean('is_urgent'),
            'is_published' => $request->boolean('is_published'),
        ]);

        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'type' => ['required', Rule::in(Announcement::TYPES)],
            'department_id' => [
                Rule::requiredIf(fn () => $request->input('type') === 'department'),
                'nullable',
                'integer',
                'exists:departments,id',
            ],
            'is_urgent' => ['boolean'],
            'is_published' => ['boolean'],
            'published_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:published_at'],
        ]);
    }
}
