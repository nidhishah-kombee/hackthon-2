<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('categories', CategoryController::class)->except(['create', 'edit', 'show']);
    Route::resource('products', ProductController::class)->except(['create', 'edit', 'show']);
    Route::resource('orders', OrderController::class)->except(['create', 'edit', 'show']);
});

Route::get('/metrics', [\App\Http\Controllers\MetricsController::class, 'index']);

Route::get('/api/anomaly', function () {
    usleep(rand(100000, 800000)); // random latency between 100ms and 800ms
    if (rand(1, 100) > 95) {
        abort(500, 'Simulated random server error for logs / traces testing');
    }
    return response()->json(['status' => 'success', 'data' => 'Simulated workload completed']);
});

// Anomaly: artificial sleep delay
Route::get('/api/anomaly/slow', function () {
    $delay = (int) request('ms', 500);
    usleep($delay * 1000);
    \Illuminate\Support\Facades\Log::warning('Slow endpoint triggered', ['delay_ms' => $delay]);
    return response()->json(['status' => 'ok', 'delay_ms' => $delay]);
});

// Anomaly: N+1 query (no eager loading)
Route::get('/api/anomaly/n-plus-one', function () {
    $tracer = \OpenTelemetry\API\Globals::tracerProvider()->getTracer('hackathon');
    $span   = $tracer->spanBuilder('anomaly.n_plus_one')->startSpan();
    $scope  = $span->activate();

    $products = \App\Models\Product::all();
    $result   = [];
    foreach ($products as $product) {
        // Intentional N+1: each iteration fires a separate query
        $result[] = ['product' => $product->name, 'category' => $product->category->name];
    }

    $scope->detach();
    $span->end();

    \Illuminate\Support\Facades\Log::warning('N+1 anomaly triggered', ['product_count' => count($result)]);
    return response()->json(['status' => 'ok', 'count' => count($result)]);
});

// Anomaly: random 500 errors
Route::get('/api/anomaly/errors', function () {
    if (rand(1, 100) <= (int) request('rate', 30)) {
        \Illuminate\Support\Facades\Log::error('Simulated 500 error injected', ['route' => '/api/anomaly/errors']);
        abort(500, 'Injected server error');
    }
    return response()->json(['status' => 'ok']);
});

require __DIR__.'/auth.php';
