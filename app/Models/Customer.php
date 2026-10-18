<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    public const STATUSES = ['lead', 'active', 'inactive', 'blocked'];

    protected $fillable = [
        'name',
        'trading_name',
        'email',
        'phone',
        'website',
        'country',
        'tax_number',
        'status',
        'assigned_salesperson_id',
        'notes',
    ];

    public function salesperson(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_salesperson_id');
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(CustomerContact::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }
}
