<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use Illuminate\Http\Request;

class CardController extends Controller
{
    /**
     * Return a JSON list of all cards with image URLs and related game.
     */
    public function index(Request $request)
    {
        $cards = Card::with('game')->get()->map(function ($card) {
            return [
                'id' => $card->id,
                'name' => $card->name,
                'game' => $card->game ? $card->game->makeHidden(['created_at', 'updated_at'])->toArray() : null,
                'suits' => $card->suits,
                'value' => $card->value,
                'suits_en' => $card->suits_en,
                'value_en' => $card->value_en,
                'name_en' => $card->name_en,
                'img_src' => $card->img_src
                    ? (preg_match('/^https?:\/\//', $card->img_src)
                        ? $card->img_src
                        : asset('storage/' . ltrim($card->img_src, '/'))
                    )
                    : null,
            ];
        });

        return response()->json(['data' => $cards]);
    }
}
