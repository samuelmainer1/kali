<?php

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;

Route::post('/login', function (Request $request) {
    $data = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
        'device_name' => ['required', 'string', 'max:255'],
    ]);

    $user = User::query()->where('email', $data['email'])->first();

    if (! $user || ! $user->is_active || ! Hash::check($data['password'], $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['These credentials do not match our records.'],
        ]);
    }

    return [
        'token' => $user->createToken($data['device_name'])->plainTextToken,
    ];
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user()->only(['id', 'name', 'email']));

    Route::delete('/logout', function (Request $request) {
        $request->user()->currentAccessToken()?->delete();

        return response()->noContent();
    });
});
