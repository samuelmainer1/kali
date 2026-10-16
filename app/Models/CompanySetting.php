<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = [
        'company_name',
        'trading_name',
        'email',
        'phone',
        'website',
        'address',
        'logo_path',
        'timezone',
        'currency',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    /**
     * Return the singleton company settings row, creating defaults if missing.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'company_name' => 'Globeflight Kenya',
            'trading_name' => 'Globeflight',
            'email' => 'info@globeflight.co.ke',
            'phone' => '+254 700 000 000',
            'website' => 'https://www.globeflight.co.ke',
            'timezone' => 'Africa/Nairobi',
            'currency' => 'KES',
        ]);
    }
}
