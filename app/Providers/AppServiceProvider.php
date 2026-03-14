<?php

namespace App\Providers;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Prometheus\CollectorRegistry;
use Prometheus\Storage\Redis;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        DB::listen(function (QueryExecuted $query) {
            if (app()->runningInConsole()) return;

            $durationSeconds = $query->time / 1000;

            // Prometheus histogram
            try {
                static $registry = null;
                if (!$registry) {
                    $registry = new CollectorRegistry(new Redis(['host' => 'redis']));
                }
                $histogram = $registry->getOrRegisterHistogram(
                    'app', 'db_query_duration_seconds', 'DB Query Duration',
                    ['connection'],
                    [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2]
                );
                $histogram->observe($durationSeconds, [$query->connectionName]);
            } catch (\Throwable) {}

            // Log slow queries (>100ms)
            if ($durationSeconds > 0.1) {
                Log::warning('Slow query detected', [
                    'duration_ms' => round($query->time, 2),
                    'sql'         => $query->sql,
                    'connection'  => $query->connectionName,
                ]);
            }
        });

        Vite::prefetch(concurrency: 3);
    }
}
