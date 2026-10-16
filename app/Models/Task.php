<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Task extends Model
{
    public const STATUSES = ['todo', 'in_progress', 'done', 'cancelled'];

    public const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    public const RELATED_TYPES = [
        'quotation' => Quotation::class,
        'shipment' => Shipment::class,
        'invoice' => Invoice::class,
        'support_ticket' => SupportTicket::class,
    ];

    protected $fillable = [
        'reference',
        'title',
        'description',
        'status',
        'priority',
        'due_date',
        'completed_at',
        'assigned_to',
        'created_by',
        'department_id',
        'related_type',
        'related_id',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function related(): MorphTo
    {
        return $this->morphTo();
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class)->latest();
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['todo', 'in_progress'], true);
    }

    public static function label(string $value): string
    {
        return str_replace('_', ' ', $value);
    }

    public static function relatedKey(?string $class): ?string
    {
        if (! $class) {
            return null;
        }

        return array_search($class, self::RELATED_TYPES, true) ?: null;
    }
}
