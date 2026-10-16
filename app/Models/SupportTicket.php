<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    public const STATUSES = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];

    public const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    public const CATEGORIES = ['general', 'shipment', 'billing', 'quotation', 'other'];

    protected $fillable = [
        'reference',
        'subject',
        'description',
        'status',
        'priority',
        'category',
        'requester_id',
        'customer_id',
        'shipment_id',
        'assigned_to',
        'resolved_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(SupportTicketReply::class)->latest();
    }

    public static function label(string $value): string
    {
        return str_replace('_', ' ', $value);
    }
}
