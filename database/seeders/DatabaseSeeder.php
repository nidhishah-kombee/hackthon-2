<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::factory()->create([
            'name'     => 'Admin User',
            'email'    => 'admin@kombee.com',
            'password' => Hash::make('password'),
        ]);

        $electronics = Category::create(['name' => 'Electronics']);
        $clothing    = Category::create(['name' => 'Clothing']);
        $furniture   = Category::create(['name' => 'Furniture']);

        $products = [];
        for ($i = 0; $i < 50; $i++) {
            $products[] = Product::create([
                'category_id' => $electronics->id,
                'name'        => 'Gadget ' . $i,
                'description' => 'A wonderful gadget to test load and limits.',
                'price'       => rand(10, 500) + 0.99,
            ]);
        }
        for ($i = 0; $i < 20; $i++) {
            $products[] = Product::create([
                'category_id' => $clothing->id,
                'name'        => 'Apparel ' . $i,
                'description' => 'Comfortable and stylish apparel.',
                'price'       => rand(5, 100) + 0.99,
            ]);
        }
        for ($i = 0; $i < 10; $i++) {
            $products[] = Product::create([
                'category_id' => $furniture->id,
                'name'        => 'Furniture Item ' . $i,
                'description' => 'Quality furniture for home and office.',
                'price'       => rand(50, 1000) + 0.99,
            ]);
        }

        // Seed some orders
        $statuses = ['pending', 'confirmed', 'cancelled'];
        foreach (array_slice($products, 0, 30) as $product) {
            Order::create([
                'user_id'     => $admin->id,
                'product_id'  => $product->id,
                'quantity'    => rand(1, 5),
                'total_price' => $product->price * rand(1, 5),
                'status'      => $statuses[array_rand($statuses)],
            ]);
        }
    }
}
