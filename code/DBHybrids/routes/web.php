<?php

use Illuminate\Support\Facades\Route;
use App\Models\Hybrid;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/hybrids', function () {
    $sortBy = request()->query('sort', 'date'); // default to 'date'

    $query = Hybrid::with('cards.game');

    switch ($sortBy) {
        case 'likes':
            $query->orderBy('nb_like', 'desc')->orderBy('created_at', 'desc');
            break;
        case 'date':
        default:
            $query->orderBy('created_at', 'desc');
            break;
    }

    $hybrids = $query->get();

    return view('hybrids.index', compact('hybrids', 'sortBy'));
})->name('hybrids.index');

Route::get('/hybrids/{id}', function ($id) {
    $hybrid = Hybrid::with('cards.game')->find($id);

    if (!$hybrid) {
        abort(404, 'Hybrid not found');
    }

    return view('hybrids.show', compact('hybrid'));
})->name('hybrids.show');

Route::get('/hybrids/{id}/download', function ($id) {
    $hybrid = Hybrid::find($id);

    if (!$hybrid) {
        abort(404, 'Hybrid not found');
    }

    if (!$hybrid->img_src) {
        abort(404, 'Image not found');
    }

    // Check if the image is an external URL
    if (preg_match('/^https?:\/\//', $hybrid->img_src)) {
        // For external URLs, redirect to the image
        return redirect($hybrid->img_src);
    }

    // For local images stored in storage
    $imagePath = storage_path('app/public/' . ltrim($hybrid->img_src, '/'));

    if (!file_exists($imagePath)) {
        abort(404, 'Image file not found');
    }

    // Generate a clean filename
    $filename = preg_replace('/[^a-zA-Z0-9-_]/', '-', $hybrid->name) . '-' . $hybrid->id . '.' . pathinfo($imagePath, PATHINFO_EXTENSION);

    return response()->download($imagePath, $filename);
})->name('hybrids.download');

Route::post('/hybrids/{id}/like', function ($id) {
    $hybrid = Hybrid::find($id);

    if (!$hybrid) {
        return response()->json(['error' => 'Hybrid not found'], 404);
    }

    // Get the action (like or unlike) from request
    $action = request()->input('action', 'like');

    if ($action === 'unlike') {
        // Decrement the like count (but don't go below 0)
        $hybrid->nb_like = max(0, $hybrid->nb_like - 1);
        $liked = false;
    } else {
        // Increment the like count
        $hybrid->nb_like = $hybrid->nb_like + 1;
        $liked = true;
    }

    $hybrid->save();

    return response()->json([
        'success' => true,
        'nb_like' => $hybrid->nb_like,
        'liked' => $liked
    ]);
})->name('hybrids.like');
