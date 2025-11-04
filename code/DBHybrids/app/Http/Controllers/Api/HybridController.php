<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hybrid;
use Illuminate\Http\Request;

class HybridController extends Controller
{
    /**
     * Return a JSON list of all hybrids with their related cards and image URLs.
     */
    public function index(Request $request)
    {
        $hybrids = Hybrid::with('cards.game')->get()->map(function ($hybrid) {
            return [
                'id' => $hybrid->id,
                'name' => $hybrid->name,
                'img_src' => $hybrid->img_src
                    ? (preg_match('/^https?:\/\//', $hybrid->img_src)
                        ? $hybrid->img_src
                        : asset('storage/' . ltrim($hybrid->img_src, '/'))
                    )
                    : null,
                'nb_like' => $hybrid->nb_like,
                'cards' => $hybrid->cards->map(function ($card) {
                    return [
                        'id' => $card->id,
                        'name' => $card->name,
                        'suits' => $card->suits,
                        'value' => $card->value,
                        'img_src' => $card->img_src
                            ? (preg_match('/^https?:\/\//', $card->img_src)
                                ? $card->img_src
                                : asset('storage/' . ltrim($card->img_src, '/'))
                            )
                            : null,
                        'french_equivalence' => $card->french_equivalence,
                        // include pivot flag if present (is_base)
                        'is_base' => isset($card->pivot) && isset($card->pivot->is_base) ? (bool) $card->pivot->is_base : false,
                    ];
                }),
            ];
        });

        return response()->json(['data' => $hybrids]);
    }
}
