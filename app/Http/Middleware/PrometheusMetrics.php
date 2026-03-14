<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Prometheus\CollectorRegistry;
use Prometheus\Storage\Redis;

class PrometheusMetrics
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->is('metrics')) {
            return $next($request);
        }

        $start    = microtime(true);
        $response = $next($request);
        $duration = microtime(true) - $start;

        try {
            $registry = new CollectorRegistry(new Redis(['host' => 'redis']));

            $route  = $request->route() ? $request->route()->uri() : 'unknown';
            $method = $request->method();
            $status = $response->getStatusCode();

            // HTTP request counter
            $counter = $registry->getOrRegisterCounter(
                'app', 'http_requests_total', 'Total HTTP requests',
                ['method', 'route', 'status']
            );
            $counter->inc([$method, $route, $status]);

            // HTTP request duration histogram
            $histogram = $registry->getOrRegisterHistogram(
                'app', 'http_request_duration_seconds', 'HTTP request duration in seconds',
                ['method', 'route'],
                [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
            );
            $histogram->observe($duration, [$method, $route]);

            // Active authenticated users gauge (increment on login, decrement on logout)
            if ($request->is('login') && $method === 'POST' && $status < 400) {
                $gauge = $registry->getOrRegisterGauge(
                    'app', 'active_users_total', 'Number of active authenticated users'
                );
                $gauge->inc();
            }
            if ($request->is('logout') && $method === 'POST') {
                try {
                    $gauge = $registry->getOrRegisterGauge(
                        'app', 'active_users_total', 'Number of active authenticated users'
                    );
                    $gauge->dec();
                } catch (\Exception) {}
            }

            // Error counter by route
            if ($status >= 500) {
                $errCounter = $registry->getOrRegisterCounter(
                    'app', 'http_errors_total', 'Total 5xx errors',
                    ['method', 'route', 'status']
                );
                $errCounter->inc([$method, $route, $status]);
            }
        } catch (\Exception $e) {
            // Ignore redis connection issues
        }

        return $response;
    }
}
