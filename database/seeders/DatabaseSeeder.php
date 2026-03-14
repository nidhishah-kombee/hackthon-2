<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin user
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@kombee.com',
            'password' => Hash::make('password'),
        ]);

        // Categories
        $electronics = Category::create(['name' => 'Electronics']);
        $clothing = Category::create(['name' => 'Clothing']);
        
        // Products
        for ($i = 0; $i < 50; $i++) {
            Product::create([
                'category_id' => $electronics->id,
                'name' => 'Gadget ' . $i,
                'description' => 'A wonderful gadget to test load and limits.',
                'price' => rand(10, 500) + 0.99
            ]);
        }
        
        for ($i = 0; $i < 20; $i++) {
            Product::create([
                'category_id' => $clothing->id,
                'name' => 'Apparel ' . $i,
                'description' => 'Comfortable and stylish apparel.',
                'price' => rand(5, 100) + 0.99
            ]);
        }
    }
}
