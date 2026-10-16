<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketingCampaign extends Model
{
    public const CHANNELS = ['email', 'whatsapp', 'sms', 'social', 'event', 'other'];

    public const STATUSES = ['draft', 'scheduled', 'active', 'completed', 'cancelled'];

    protected $fillable = [
        'reference',
        'name',
        'channel',
        'status',
        'audience',
        'content',
        'budget',
        'currency',
        'start_date',
        'end_date',
        'metrics',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
            'metrics' => 'array',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(MarketingLead::class, 'campaign_id');
    }

    public static function label(string $value): string
    {
        return str_replace('_', ' ', $value);
    }
}
