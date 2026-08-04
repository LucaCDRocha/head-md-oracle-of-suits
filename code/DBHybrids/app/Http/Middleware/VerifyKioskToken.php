<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyKioskToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedToken = config('app.kiosk_api_token');
        $providedToken = $request->bearerToken() ?: $request->header('X-API-KEY');

        if (!$expectedToken || !$providedToken || !hash_equals((string) $expectedToken, (string) $providedToken)) {
            return response()->json(['error' => 'Unauthorized. Invalid Token.'], 401);
        }

        return $next($request);
    }
}
