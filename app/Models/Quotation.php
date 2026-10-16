<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quotation extends Model
{
    public const STATUSES = [
        'draft',
        'pending_approval',
        'approved',
        'rejected',
        'converted',
        'cancelled',
    ];

    public const SERVICE_TYPES = ['air', 'sea', 'road', 'express', 'other'];

    protected $fillable = [
        'reference',
        'customer_id',
        'contact_id',
        'created_by',
        'status',
        'valid_until',
        'currency',
        'subtotal',
        'tax_amount',
        'total',
        'origin_country',
        'destination_country',
        'service_type',
        'notes',
        'terms',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
        'converted_shipment_id',
    ];

    protected function casts(): array
    {
        return [
            'valid_until' => 'date',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(CustomerContact::class, 'contact_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class)->orderBy('sort_order');
    }

    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class, 'converted_shipment_id');
    }

    public function isEditable(): bool
    {
        return in_array($this->status, ['draft', 'rejected'], true);
    }
}
