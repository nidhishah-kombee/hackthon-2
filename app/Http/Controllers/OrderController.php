<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use OpenTelemetry\API\Globals;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    public function index(Request $request)
    {
        $tracer = Globals::tracerProvider()->getTracer('hackathon');
        $span = $tracer->spanBuilder('OrderController.index')->startSpan();
        $scope = $span->activate();

        try {
            $orders = $this->orderService->list($request->only(['search', 'status']), $request->user()->id);
            $products = Product::all(['id', 'name', 'price']);

            return Inertia::render('Orders/Index', [
                'orders'   => $orders,
                'products' => $products,
                'filters'  => $request->only(['search', 'status']),
            ]);
        } finally {
            $scope->detach();
            $span->end();
        }
    }

    public function store(Request $request)
    {
        $tracer = Globals::tracerProvider()->getTracer('hackathon');
        $span = $tracer->spanBuilder('OrderController.store')->startSpan();
        $scope = $span->activate();

        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,id',
                'quantity'   => 'required|integer|min:1|max:100',
            ]);

            $this->orderService->create($validated, $request->user()->id);
            return redirect()->back()->with('success', 'Order placed successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Order validation failed', ['errors' => $e->errors(), 'user_id' => $request->user()->id]);
            throw $e;
        } finally {
            $scope->detach();
            $span->end();
        }
    }

    public function update(Request $request, Order $order)
    {
        $tracer = Globals::tracerProvider()->getTracer('hackathon');
        $span = $tracer->spanBuilder('OrderController.update')->startSpan();
        $scope = $span->activate();

        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,confirmed,cancelled',
            ]);

            $this->orderService->update($order, $validated);
            return redirect()->back()->with('success', 'Order updated successfully.');
        } finally {
            $scope->detach();
            $span->end();
        }
    }

    public function destroy(Order $order)
    {
        $tracer = Globals::tracerProvider()->getTracer('hackathon');
        $span = $tracer->spanBuilder('OrderController.destroy')->startSpan();
        $scope = $span->activate();

        try {
            $this->orderService->delete($order);
            return redirect()->back()->with('success', 'Order deleted successfully.');
        } finally {
            $scope->detach();
            $span->end();
        }
    }
}
