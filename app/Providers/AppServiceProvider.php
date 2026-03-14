<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Prometheus\CollectorRegistry;
use Prometheus\Storage\Redis;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        try {
            DB::listen(function (QueryExecuted $query) {
                // Skip if we are running migrations or similar
                if (app()->runningInConsole()) return;

                static $registry = null;
                if (!$registry) {
                    $registry = new CollectorRegistry(new Redis(['host' => 'redis']));
                }
                
                $histogram = $registry->getOrRegisterHistogram('app', 'db_query_duration_seconds', 'DB Query Duration', ['connection'], [0.01, 0.05, 0.1, 0.5, 1, 2]);
                $histogram->observe($query->time / 1000, [$query->connectionName]);
            });
        } catch (\Throwable $e) {}

        Vite::prefetch(concurrency: 3);
    }
}
