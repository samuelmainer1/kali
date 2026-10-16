<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shipment extends Model
{
    public const STATUSES = [
        'created',
        'cargo_collected',
        'warehouse',
        'booked',
        'departed',
        'arrived',
        'customs_clearance',
        'out_for_delivery',
        'delivered',
    ];

    protected $fillable = [
        'reference',
        'quotation_id',
        'customer_id',
        'branch_id',
        'status',
        'origin_country',
        'destination_country',
        'current_location',
        'service_type',
        'pieces',
        'weight_kg',
        'tracking_number',
        'expected_departure',
        'expected_arrival',
        'delivered_at',
        'created_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'expected_departure' => 'date',
            'expected_arrival' => 'date',
            'delivered_at' => 'datetime',
            'weight_kg' => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(ShipmentStatusHistory::class)->latest('created_at');
    }

    public function inventoryItems(): HasMany
    {
        return $this->hasMany(InventoryItem::class);
    }

    public function cargoMovements(): HasMany
    {
        return $this->hasMany(CargoMovement::class)->latest('moved_at');
    }

    public function nextStatus(): ?string
    {
        $index = array_search($this->status, self::STATUSES, true);
        if ($index === false || $index >= count(self::STATUSES) - 1) {
            return null;
        }

        return self::STATUSES[$index + 1];
    }

    public static function label(string $status): string
    {
        return str_replace('_', ' ', $status);
    }
}
