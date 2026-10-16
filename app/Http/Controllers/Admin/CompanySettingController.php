<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanySettingController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog)
    {
    }

    public function edit(): Response
    {
        $settings = CompanySetting::current();

        return Inertia::render('Admin/Settings/Edit', [
            'settings' => $settings->only([
                'id',
                'company_name',
                'trading_name',
                'email',
                'phone',
                'website',
                'address',
                'timezone',
                'currency',
            ]),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'trading_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'website' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'timezone' => ['required', 'timezone:all'],
            'currency' => ['required', 'string', 'size:3'],
        ]);

        if (($data['website'] ?? '') === '') {
            $data['website'] = null;
        }

        $settings = CompanySetting::current();
        $settings->update($data);

        $this->activityLog->log('settings.updated', 'Updated company settings', $settings);

        return back()->with('success', 'Company settings saved.');
    }
}
