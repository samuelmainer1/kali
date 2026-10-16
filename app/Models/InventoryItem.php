<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    public const STATUSES = ['available', 'held', 'dispatched'];

    protected $fillable = [
        'sku',
        'name',
        'description',
        'quantity_on_hand',
        'unit',
        'branch_id',
        'shipment_id',
        'location_code',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'quantity_on_hand' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(CargoMovement::class);
    }
}
