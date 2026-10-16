<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable([
    'name',
    'email',
    'password',
    'phone',
    'employee_code',
    'department_id',
    'branch_id',
    'is_active',
    'last_login_at',
    'avatar_path',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    protected static function boot(): void
    {
        // Register before Spatie detaches roles during deletion.
        static::deleting(function (User $user) {
            $actor = Auth::user();

            if ($actor && ! $actor->hasRole('administrator') && $user->isAdministrator()) {
                throw new AuthorizationException('You cannot delete an administrator account.');
            }
        });

        parent::boot();
    }

    /**
     * Administrator accounts are visible only to an administrator.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public function scopeVisibleTo(Builder $query, User $viewer): Builder
    {
        if ($viewer->hasRole('administrator')) {
            return $query;
        }

        return $query->whereDoesntHave('roles', fn (Builder $roles) => $roles->where('name', 'administrator'));
    }

    public function isAdministrator(): bool
    {
        return $this->roles()->where('name', 'administrator')->exists();
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Primary role name for dashboard routing and UI labels.
     */
    public function primaryRole(): ?string
    {
        return $this->getRoleNames()->first();
    }
}
