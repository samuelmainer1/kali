<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Announcement extends Model
{
    public const TYPES = ['company', 'department', 'emergency', 'policy'];

    protected $fillable = [
        'reference',
        'title',
        'body',
        'type',
        'department_id',
        'is_urgent',
        'is_published',
        'published_at',
        'expires_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_urgent' => 'boolean',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(AnnouncementRead::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('is_published', true)
            ->where(function ($q) {
                $q->whereNull('published_at')->orWhere('published_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Company-wide (no department) is visible to every employee.
     * Department-targeted announcements are only visible to that department.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return $query->where(function ($inner) use ($user) {
            $inner->whereNull('department_id')
                ->orWhere('department_id', $user->department_id);
        });
    }

    public function isVisibleTo(User $user): bool
    {
        if (! $this->is_published) {
            return false;
        }

        if ($this->published_at && $this->published_at->isFuture()) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->department_id === null) {
            return true;
        }

        return (int) $this->department_id === (int) $user->department_id;
    }

    public static function label(string $value): string
    {
        return str_replace('_', ' ', $value);
    }
}
