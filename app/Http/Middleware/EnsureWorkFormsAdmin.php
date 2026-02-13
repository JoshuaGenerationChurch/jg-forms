<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWorkFormsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $email = strtolower(trim((string) $user->email));
        $adminEmails = config('workforms.admin_emails', []);

        if (! is_array($adminEmails)) {
            abort(403);
        }

        if (count($adminEmails) === 0) {
            return $next($request);
        }

        if (! in_array($email, $adminEmails, true)) {
            abort(403);
        }

        return $next($request);
    }
}
