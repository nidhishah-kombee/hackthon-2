<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $tracer = \OpenTelemetry\API\Globals::tracerProvider()->getTracer('hackathon');
        $span = $tracer->spanBuilder('fetch_categories')->startSpan();
        
        $query = Category::query();
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        $categories = $query->latest()->paginate(10)->withQueryString();
        
        $span->end();
        
        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        Category::create($validated);
        return redirect()->back()->with('success', 'Category created successfully.');
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        $category->update($validated);
        return redirect()->back()->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return redirect()->back()->with('success', 'Category deleted successfully.');
    }
}
