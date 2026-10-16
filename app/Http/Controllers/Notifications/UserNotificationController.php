<?php

namespace App\Http\Controllers\Notifications;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use App\Services\AppNotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserNotificationController extends Controller
{
    public function __construct(private readonly AppNotificationService $notifications) {}

    public function index(Request $request): Response
    {
        $notifications = UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(30)
            ->withQueryString()
            ->through(fn (UserNotification $item) => [
                'id' => $item->id,
                'type' => $item->type,
                'title' => $item->title,
                'body' => $item->body,
                'link' => $item->link,
                'is_read' => (bool) $item->read_at,
                'created_at' => $item->created_at?->diffForHumans(),
            ]);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function markRead(Request $request, UserNotification $userNotification)
    {
        $this->notifications->markRead($userNotification, $request->user());

        if ($userNotification->link) {
            return redirect()->to($userNotification->link);
        }

        return back();
    }

    public function markAllRead(Request $request)
    {
        $this->notifications->markAllRead($request->user());

        return back()->with('success', 'All notifications marked as read.');
    }
}
