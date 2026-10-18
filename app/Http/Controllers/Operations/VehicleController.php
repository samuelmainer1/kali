<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VehicleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Operations/Vehicles/Index', [
            'vehicles' => Vehicle::query()->orderBy('registration')->get(),
            'types' => Vehicle::TYPES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'registration' => ['required', 'string', 'max:40', 'unique:vehicles,registration'],
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', Rule::in(Vehicle::TYPES)],
        ]);

        Vehicle::query()->create([...$data, 'is_active' => true]);

        return back()->with('success', 'Vehicle added.');
    }

    public function update(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $data = $request->validate([
            'registration' => ['required', 'string', 'max:40', Rule::unique('vehicles', 'registration')->ignore($vehicle->id)],
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', Rule::in(Vehicle::TYPES)],
            'is_active' => ['required', 'boolean'],
        ]);

        $vehicle->update($data);

        return back()->with('success', 'Vehicle updated.');
    }
}
