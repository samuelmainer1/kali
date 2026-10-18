<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    public const STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

    protected $fillable = [
        'reference',
        'customer_id',
        'quotation_id',
        'shipment_id',
        'status',
        'currency',
        'subtotal',
        'tax_amount',
        'total',
        'issue_date',
        'due_date',
        'paid_at',
        'notes',
        'terms',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'issue_date' => 'date',
            'due_date' => 'date',
            'paid_at' => 'datetime',
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

    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('sort_order');
    }

    public function isEditable(): bool
    {
        return $this->status === 'draft';
    }

    public static function label(string $value): string
    {
        return str_replace('_', ' ', $value);
    }
}
