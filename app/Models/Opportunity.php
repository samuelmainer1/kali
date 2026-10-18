<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Opportunity extends Model
{
    public const STAGES = [
        'new_lead',
        'contacted',
        'quotation',
        'negotiation',
        'won',
        'lost',
    ];

    public const OPEN_STAGES = [
        'new_lead',
        'contacted',
        'quotation',
        'negotiation',
    ];

    protected $fillable = [
        'reference',
        'title',
        'customer_id',
        'owner_id',
        'created_by',
        'stage',
        'expected_value',
        'currency',
        'next_follow_up',
        'quotation_id',
        'notes',
        'lost_reason',
        'won_at',
        'lost_at',
    ];

    protected function casts(): array
    {
        return [
            'expected_value' => 'decimal:2',
            'next_follow_up' => 'date',
            'won_at' => 'datetime',
            'lost_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('stage', self::OPEN_STAGES);
    }

    public function scopeOwnedBy(Builder $query, User $user): Builder
    {
        return $query->where('owner_id', $user->id);
    }

    public function isClosed(): bool
    {
        return in_array($this->stage, ['won', 'lost'], true);
    }

    public function isOverdue(): bool
    {
        return $this->next_follow_up
            && $this->next_follow_up->isPast()
            && ! $this->isClosed();
    }

    public static function stageLabel(string $stage): string
    {
        return match ($stage) {
            'new_lead' => 'New Lead',
            'contacted' => 'Contacted',
            'quotation' => 'Quotation',
            'negotiation' => 'Negotiation',
            'won' => 'Won',
            'lost' => 'Lost',
            default => str_replace('_', ' ', $stage),
        };
    }
}
