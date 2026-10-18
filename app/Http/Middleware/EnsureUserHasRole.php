<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restrict a route to one or more Spatie roles.
 */
class EnsureUserHasRole
{
    /**
     * @param  string  ...$roles  Role names (OR logic)
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole($roles)) {
            abort(403, 'You are not authorized to access this area.');
        }

        return $next($request);
    }
}
