<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;

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
});

Route::get('/metrics', [\App\Http\Controllers\MetricsController::class, 'index']);

Route::get('/api/anomaly', function () {
    usleep(rand(100000, 800000)); // random latency between 100ms and 800ms
    if (rand(1, 100) > 95) {
        abort(500, 'Simulated random server error for logs / traces testing');
    }
    return response()->json(['status' => 'success', 'data' => 'Simulated workload completed']);
});

require __DIR__.'/auth.php';
