<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\Log;
use OpenTelemetry\API\Globals;

class OrderService
{
    private function tracer()
    {
        return Globals::tracerProvider()->getTracer('hackathon');
    }

    public function list(array $filters, int $userId)
    {
        $span = $this->tracer()->spanBuilder('OrderService.list')->startSpan();
        $scope = $span->activate();

        try {
            $query = Order::with(['product', 'user'])->where('user_id', $userId);

            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }
            if (!empty($filters['search'])) {
                $query->whereHas('product', fn($q) => $q->where('name', 'like', '%' . $filters['search'] . '%'));
            }

            $result = $query->latest()->paginate(10)->withQueryString();

            $span->setAttribute('orders.count', $result->total());
            Log::info('Orders listed', ['user_id' => $userId, 'total' => $result->total(), 'filters' => $filters]);

            return $result;
        } finally {
            $scope->detach();
            $span->end();
        }
    }

    public function create(array $data, int $userId)
    {
        $span = $this->tracer()->spanBuilder('OrderService.create')->startSpan();
        $scope = $span->activate();

        try {
            $productSpan = $this->tracer()->spanBuilder('OrderService.fetchProduct')->startSpan();
            $productScope = $productSpan->activate();
            $product = Product::findOrFail($data['product_id']);
            $productScope->detach();
            $productSpan->end();

            $calcSpan = $this->tracer()->spanBuilder('OrderService.calculateTotal')->startSpan();
            $calcScope = $calcSpan->activate();
            $total = $product->price * $data['quantity'];
            $calcScope->detach();
            $calcSpan->end();

            $saveSpan = $this->tracer()->spanBuilder('OrderService.saveOrder')->startSpan();
            $saveScope = $saveSpan->activate();
            $order = Order::create([
                'user_id'     => $userId,
                'product_id'  => $data['product_id'],
                'quantity'    => $data['quantity'],
                'total_price' => $total,
                'status'      => 'pending',
            ]);
            $saveScope->detach();
            $saveSpan->end();

            $span->setAttribute('order.id', $order->id);
            $span->setAttribute('order.total', $total);

            Log::info('Order created', [
                'order_id'   => $order->id,
                'user_id'    => $userId,
                'product_id' => $product->id,
                'total'      => $total,
            ]);

            return $order;
        } finally {
            $scope->detach();
            $span->end();
        }
    }

    public function update(Order $order, array $data)
    {
        $span = $this->tracer()->spanBuilder('OrderService.update')->startSpan();
        $scope = $span->activate();

        try {
            $order->update($data);
            $span->setAttribute('order.id', $order->id);
            Log::info('Order updated', ['order_id' => $order->id, 'data' => $data]);
            return $order;
        } finally {
            $scope->detach();
            $span->end();
        }
    }

    public function delete(Order $order)
    {
        $span = $this->tracer()->spanBuilder('OrderService.delete')->startSpan();
        $scope = $span->activate();

        try {
            $id = $order->id;
            $order->delete();
            $span->setAttribute('order.id', $id);
            Log::info('Order deleted', ['order_id' => $id]);
        } finally {
            $scope->detach();
            $span->end();
        }
    }
}
