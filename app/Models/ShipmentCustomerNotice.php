<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShipmentCustomerNotice extends Model
{
    protected $fillable = [
        'shipment_id',
        'channel',
        'destination',
        'status',
        'subject',
        'body',
    ];

    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }
}
