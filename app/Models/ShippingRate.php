<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingRate extends Model
{
    protected $fillable = [
        'name',
        'origin',
        'destination',
        'service_type',
        'min_weight_kg',
        'max_weight_kg',
        'price',
        'currency',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'min_weight_kg' => 'decimal:2',
            'max_weight_kg' => 'decimal:2',
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }
}
