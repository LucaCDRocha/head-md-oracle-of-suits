<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hybrid;
use Illuminate\Http\Request;
use App\Models\Card;

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

    /**
     * Create a new hybrid from three card ids and a base card id.
     * Expected payload:
     * {
     *   "name": "Optional name",
     *   "img_src": "optional image path or url",
     *   "cards": [1,2,3],
     *   "base_card_id": 2
     * }
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'nullable|string|max:191',
            'img_src' => 'nullable|string',
            'cards' => 'required|array|size:3',
            'cards.*' => 'required|integer|distinct',
            'base_card_id' => 'required|integer',
        ]);

        if (!in_array($data['base_card_id'], $data['cards'])) {
            return response()->json(['error' => 'base_card_id must be one of the cards array'], 422);
        }

        // Verify cards exist
        $existing = Card::whereIn('id', $data['cards'])->pluck('id')->all();
        if (count($existing) !== 3) {
            return response()->json(['error' => 'One or more cards not found'], 422);
        }

        $hybrid = Hybrid::create([
            'name' => $data['name'] ?? null,
            'img_src' => $data['img_src'] ?? null,
            'nb_like' => 0,
        ]);

        // Attach cards with pivot is_base flag
        $attach = [];
        foreach ($data['cards'] as $cid) {
            $attach[$cid] = ['is_base' => ($cid == $data['base_card_id']) ? 1 : 0];
        }
        $hybrid->cards()->attach($attach);

        $hybrid->load('cards.game');

        $payload = [
            'id' => $hybrid->id,
            'name' => $hybrid->name,
            'img_src' => $hybrid->img_src
                ? (preg_match('/^https?:\/\//', $hybrid->img_src)
                    ? $hybrid->img_src
                    : (str_starts_with($hybrid->img_src, 'img/') ? asset($hybrid->img_src) : asset('storage/' . ltrim($hybrid->img_src, '/')))
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
                    'is_base' => isset($card->pivot) && isset($card->pivot->is_base) ? (bool) $card->pivot->is_base : false,
                ];
            }),
        ];

        return response()->json(['data' => $payload], 201);
    }
}
