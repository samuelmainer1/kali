<?php

namespace App\Support;

class RoleLabel
{
    public static function get(?string $role): string
    {
        return match ($role) {
            'marketing' => 'IT & Marketing',
            null, '' => '',
            default => str_replace('_', ' ', $role),
        };
    }
}
