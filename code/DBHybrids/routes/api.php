<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\HybridController;
use App\Http\Middleware\VerifyKioskToken;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('/cards', [CardController::class, 'index']);
Route::get('/hybrids', [HybridController::class, 'index']);
Route::get('/hybrids/{id}', [HybridController::class, 'show']);

// Kiosk creation protected by pre-shared static API token
Route::post('/hybrids', [HybridController::class, 'store'])->middleware(VerifyKioskToken::class);

// Public likes endpoint with device UUID tracking and rate limiting (150 req/min per IP)
Route::post('/hybrids/{id}/like', [HybridController::class, 'like'])->middleware('throttle:150,1');

