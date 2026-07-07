<?php

namespace App\Http\Middleware;

use App\Support\ShopContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetShopContext
{
    public function handle(Request $request, Closure $next): Response
    {
        ShopContext::clear();

        $user = $request->user();

        if ($user && ! $user->isSuperAdmin() && $user->shop_id) {
            ShopContext::set($user->shop_id);
        }

        return $next($request);
    }
}
