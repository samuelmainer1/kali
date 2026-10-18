<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeReport extends Model
{
    public const PERIOD_TYPES = ['daily', 'weekly', 'monthly'];

    public const STATUSES = [
        'draft',
        'submitted',
        'approved',
        'rejected',
        'revision_requested',
    ];

    protected $fillable = [
        'reference',
        'user_id',
        'department_id',
        'branch_id',
        'period_type',
        'period_start',
        'period_end',
        'title',
        'accomplishments',
        'challenges',
        'next_plans',
        'metrics',
        'status',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
        'reviewer_notes',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'metrics' => 'array',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function isEditable(): bool
    {
        return in_array($this->status, ['draft', 'revision_requested'], true);
    }

    public function isReviewable(): bool
    {
        return $this->status === 'submitted';
    }

    public static function label(string $value): string
    {
        return str_replace('_', ' ', $value);
    }
}
