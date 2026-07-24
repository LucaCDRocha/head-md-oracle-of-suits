<?php

namespace Database\Seeders;

use App\Models\Hybrid;
use App\Models\Card;
use Illuminate\Support\Facades\File;
use Illuminate\Database\Seeder;

class HybridsTableSeeder extends Seeder
{
    public function run()
    {
        // Look first for images under public/img/hybrids (project public folder),
        // otherwise fallback to storage/app/public/hybrids (public disk).
        $publicDir = public_path('img/hybrids');
        $storageDir = storage_path('app/public/img/hybrids');

        $source = null;
        if (File::exists($publicDir)) {
            $hybridsDir = $publicDir;
            $source = 'public';
        } else {
            $hybridsDir = $storageDir;
            $source = 'storage';
            if (!File::exists($hybridsDir)) {
                File::makeDirectory($hybridsDir, 0755, true);
            }
        }

        $files = File::files($hybridsDir);

        // If no files found, just warn and return
        if (count($files) === 0) {
            $this->command->warn("No hybrid image files found in {$hybridsDir}. Seed skipped.");
            return;
        }

        // Need at least 3 cards in the database to attach
        $cardsCount = Card::count();
        if ($cardsCount < 3) {
            // fallback: create two example hybrids without attachments
            Hybrid::create([
                'name' => 'Example Hybrid A',
                'nb_like' => 0,
                'img_src' => null,
            ]);

            Hybrid::create([
                'name' => 'Example Hybrid B',
                'nb_like' => 0,
                'img_src' => null,
            ]);

            $this->command->info("Not enough cards to create hybrids (need >=3). Created example hybrids.");
            return;
        }

        foreach ($files as $file) {
            $filename = $file->getFilename();
            $name = pathinfo($filename, PATHINFO_FILENAME);

            // helper to find card by flexible tokens
            $findCard = function ($query) {
                // try exact id if numeric
                if (is_numeric($query)) {
                    return Card::find((int) $query);
                }

                $q = strtolower($query);

                // search in french_equivalence, name, value, suits
                $card = Card::whereRaw('LOWER(french_equivalence) LIKE ?', ["%{$q}%"])->first();
                if ($card) return $card;

                $card = Card::whereRaw('LOWER(name) LIKE ?', ["%{$q}%"])->first();
                if ($card) return $card;

                $card = Card::whereRaw('LOWER(value) LIKE ?', ["%{$q}%"])->first();
                if ($card) return $card;

                $card = Card::whereRaw('LOWER(suits) LIKE ?', ["%{$q}%"])->first();
                if ($card) return $card;

                return null;
            };

            // special mapping for certain filenames
            $special = null;
            if (strtolower($name) === 'ha') {
                // HA: Roi de Pique, As de Rose (is_base), Dame de Coupe
                $special = [
                    ['query' => 'Roi de Pique', 'is_base' => false],
                    ['query' => 'As de Rose', 'is_base' => true],
                    ['query' => 'Dame de Coupe', 'is_base' => false],
                ];
            } elseif (strtolower($name) === 'hq') {
                // HQ: 3 de Denier, Atout 1, Dame de Coupe (is_base)
                $special = [
                    ['query' => '3 de Denier', 'is_base' => false],
                    ['query' => 'Atout 1', 'is_base' => false],
                    ['query' => 'Dame de Coupe', 'is_base' => true],
                ];
            }

            // create hybrid with img_src pointing to the relative img path (store as "img/..."), 
            // so callers can add "storage/" if they need the public storage URL and avoid "storage/storage" duplication
            $imgSrc = 'img/hybrids/' . $filename;
            $hybrid = Hybrid::create([
                'name' => $name,
                'nb_like' => 0,
                'img_src' => $imgSrc,
            ]);

            if ($special) {
                $foundIds = [];
                foreach ($special as $item) {
                    $card = $findCard($item['query']);
                    if ($card) {
                        $foundIds[] = ['id' => $card->id, 'is_base' => $item['is_base']];
                    } else {
                        // fallback to random card if not found
                        $fallback = Card::inRandomOrder()->first();
                        if ($fallback) {
                            $foundIds[] = ['id' => $fallback->id, 'is_base' => $item['is_base']];
                            $this->command->warn("Could not find card matching '{$item['query']}', attached random card id {$fallback->id} instead for hybrid {$name}.");
                        }
                    }
                }

                // ensure we have 3 ids
                if (count($foundIds) === 3) {
                    $attach = [];
                    foreach ($foundIds as $f) {
                        $attach[$f['id']] = ['is_base' => $f['is_base'] ? 1 : 0];
                    }
                    // ensure only these cards are attached (replace any existing attachments)
                    $hybrid->cards()->sync($attach);
                    $this->command->info("Created special hybrid {$hybrid->id} ({$name}) attached to cards: " . implode(',', array_column($foundIds, 'id')));
                    continue;
                }
                // else fall back to random below
            }

            // pick three random distinct cards
            $cardIds = Card::inRandomOrder()->limit(3)->pluck('id')->toArray();

            // attach them and mark the first as the base
            $attach = [];
            foreach ($cardIds as $index => $cid) {
                $attach[$cid] = ['is_base' => $index === 0 ? 1 : 0];
            }

            // ensure only these cards are attached
            $hybrid->cards()->sync($attach);
            $this->command->info("Created hybrid {$hybrid->id} from {$filename} attached to cards: " . implode(',', $cardIds));
        }
    }
}
