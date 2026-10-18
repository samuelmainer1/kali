<?php

namespace App\Http\Middleware;

use App\Models\CompanySetting;
use App\Services\AnnouncementService;
use App\Services\AppNotificationService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user()?->loadMissing(['department', 'branch']);
        $announcementService = app(AnnouncementService::class);
        $notificationService = app(AppNotificationService::class);

        $canViewAnnouncements = $user ? $announcementService->canView($user) : false;

        $announcementBell = [
            'enabled' => $canViewAnnouncements,
            'unread_count' => 0,
            'items' => [],
        ];

        if ($canViewAnnouncements) {
            $announcementBell = [
                'enabled' => true,
                'unread_count' => $announcementService->unreadCount($user),
                'items' => $announcementService->unreadPreview($user)->map(fn ($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'type' => $item->type,
                    'is_urgent' => $item->is_urgent,
                    'published_at' => $item->published_at?->diffForHumans(),
                ])->values()->all(),
            ];
        }

        $systemNotifications = [
            'enabled' => (bool) $user,
            'unread_count' => 0,
            'items' => [],
        ];

        if ($user) {
            $systemNotifications = [
                'enabled' => true,
                'unread_count' => $notificationService->unreadCount($user),
                'items' => $notificationService->unreadPreview($user)->map(fn ($item) => [
                    'id' => $item->id,
                    'type' => $item->type,
                    'title' => $item->title,
                    'body' => $item->body,
                    'link' => $item->link,
                    'is_read' => (bool) $item->read_at,
                    'created_at' => $item->created_at?->diffForHumans(),
                ])->values()->all(),
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->primaryRole(),
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                    'department' => $user->department?->only(['id', 'name', 'code']),
                    'branch' => $user->branch?->only(['id', 'name', 'code']),
                ] : null,
            ],
            'announcementBell' => $announcementBell,
            'systemNotifications' => $systemNotifications,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
            ],
            'app' => [
                'name' => config('app.name', 'Globeflight ILMS'),
                'tagline' => '24 • seven • 365',
            ],
            'company' => function () {
                $company = CompanySetting::current();

                return [
                    'name' => $company->company_name,
                    'email' => $company->email,
                    'phone' => $company->phone,
                    'address' => $company->address,
                    'website' => $company->website,
                ];
            },
        ];
    }
}
