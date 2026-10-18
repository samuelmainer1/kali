<?php

namespace App\Http\Controllers\Approvals;

use App\Http\Controllers\Controller;
use App\Services\ApprovalsService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalsController extends Controller
{
    public function __construct(private readonly ApprovalsService $approvals) {}

    public function index(Request $request): Response
    {
        abort_unless($this->approvals->canAccess($request->user()), 403);

        $data = $request->validate([
            'type' => ['nullable', Rule::in(['leave', 'procurement', 'quotations', 'reports'])],
        ]);

        $type = $data['type'] ?? null;
        $payload = $this->approvals->pendingFor($request->user(), $type);

        return Inertia::render('Approvals/Index', [
            'filters' => ['type' => $type],
            'total' => $payload['total'],
            'counts' => $payload['counts'],
            'items' => $payload['items'],
            'types' => [
                ['value' => 'leave', 'label' => 'Leave'],
                ['value' => 'procurement', 'label' => 'Purchase requests'],
                ['value' => 'quotations', 'label' => 'Quotations'],
                ['value' => 'reports', 'label' => 'Reports'],
            ],
        ]);
    }
}
