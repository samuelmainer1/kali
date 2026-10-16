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
            'email' => 'cs@globeflight.co.ke',
            'phone' => '+254 729 341 277',
            'address' => 'Nextgen Mall, 3rd Floor, Suite 39/40. Mombasa Road, Nairobi, Kenya.',
            'website' => 'https://www.globeflight.co.ke',
            'timezone' => 'Africa/Nairobi',
            'currency' => 'KES',
        ]);
    }
}
