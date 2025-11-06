<?php

use Illuminate\Support\Facades\Route;
use App\Models\Hybrid;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/hybrids', function () {
    $hybrids = Hybrid::with('cards.game')->orderBy('created_at', 'desc')->get();
    return view('hybrids.index', compact('hybrids'));
})->name('hybrids.index');
