<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use App\Models\ShippingRate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ShippingRateController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Sales/Rates/Index', [
            'rates' => ShippingRate::query()->orderBy('name')->get(),
            'serviceTypes' => Quotation::SERVICE_TYPES,
            'canManage' => request()->user()->can('rates.manage'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        ShippingRate::query()->create($this->validated($request));

        return back()->with('success', 'Rate added.');
    }

    public function update(Request $request, ShippingRate $shippingRate): RedirectResponse
    {
        $shippingRate->update($this->validated($request));

        return back()->with('success', 'Rate updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'origin' => ['required', 'string', 'max:120'],
            'destination' => ['required', 'string', 'max:120'],
            'service_type' => ['required', Rule::in(Quotation::SERVICE_TYPES)],
            'min_weight_kg' => ['required', 'numeric', 'min:0'],
            'max_weight_kg' => ['nullable', 'numeric', 'gte:min_weight_kg'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'is_active' => ['required', 'boolean'],
        ]);
    }
}
