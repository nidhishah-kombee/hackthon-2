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
        // Don't trace the metrics endpoint itself to avoid infinite loop of metrics
        if ($request->is('metrics')) {
            return $next($request);
        }

        $start = microtime(true);
        $response = $next($request);
        $duration = microtime(true) - $start;
        
        try {
            $registry = new CollectorRegistry(new Redis(['host' => 'redis']));
            
            $route = $request->route() ? $request->route()->uri() : 'unknown';
            $status = $response->getStatusCode();
            
            // Counter
            $counter = $registry->getOrRegisterCounter('app', 'http_requests_total', 'Total HTTP requests', ['method', 'route', 'status']);
            $counter->inc([$request->method(), $route, $status]);
            
            // Histogram
            $histogram = $registry->getOrRegisterHistogram('app', 'http_request_duration_seconds', 'HTTP request duration in seconds', ['method', 'route'], [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]);
            $histogram->observe($duration, [$request->method(), $route]);
        } catch (\Exception $e) {
            // Ignore redis connection issues locally
        }
        
        return $response;
    }
}
