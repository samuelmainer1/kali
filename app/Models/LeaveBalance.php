<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalance extends Model
{
    protected $fillable = [
        'user_id',
        'leave_type_id',
        'year',
        'entitled',
        'taken',
        'carried_over',
    ];

    protected function casts(): array
    {
        return [
            'entitled' => 'float',
            'taken' => 'float',
            'carried_over' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function remaining(): float
    {
        return round((float) $this->entitled + (float) $this->carried_over - (float) $this->taken, 1);
    }
}
