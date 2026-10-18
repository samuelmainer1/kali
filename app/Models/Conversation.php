<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    public const TYPE_DIRECT = 'direct';

    public const TYPE_DEPARTMENT = 'department';

    protected $fillable = [
        'type',
        'department_id',
        'direct_key',
        'created_by',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(ChatMessage::class)->latestOfMany();
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $inner) use ($user) {
            $inner->whereHas('participants', fn (Builder $participants) => $participants->where('user_id', $user->id));

            if ($user->department_id) {
                $inner->orWhere(function (Builder $department) use ($user) {
                    $department->where('type', self::TYPE_DEPARTMENT)
                        ->where('department_id', $user->department_id);
                });
            }
        });
    }

    public static function directKey(int $firstUserId, int $secondUserId): string
    {
        $ids = [$firstUserId, $secondUserId];
        sort($ids);

        return $ids[0].':'.$ids[1];
    }
}
