<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseRequest extends Model
{
    public const STATUSES = [
        'submitted',
        'approved',
        'rejected',
        'processed',
        'cancelled',
    ];

    protected $fillable = [
        'reference',
        'title',
        'justification',
        'status',
        'department_id',
        'requested_by',
        'total_amount',
        'currency',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'processed_by',
        'processed_at',
        'finance_notes',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'approved_at' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public static function statusLabel(string $status): string
    {
        return match ($status) {
            'submitted' => 'Pending approval',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'processed' => 'Processed',
            'cancelled' => 'Cancelled',
            default => str_replace('_', ' ', $status),
        };
    }

    public function recalculateTotal(): void
    {
        $this->total_amount = $this->items()->sum('line_total');
        $this->save();
    }
}
