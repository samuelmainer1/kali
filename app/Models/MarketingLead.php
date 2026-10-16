<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketingLead extends Model
{
    public const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

    protected $fillable = [
        'name',
        'email',
        'phone',
        'company',
        'source',
        'status',
        'campaign_id',
        'customer_id',
        'assigned_to',
        'notes',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(MarketingCampaign::class, 'campaign_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public static function label(string $value): string
    {
        return str_replace('_', ' ', $value);
    }
}
