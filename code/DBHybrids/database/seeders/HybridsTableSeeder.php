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

        // If no files found, create default special hybrids HA and HQ
        if (count($files) === 0) {
            $this->command->warn("No hybrid image files found in {$hybridsDir}. Creating default HA and HQ hybrids from mapping.");

            $specialSets = [
                'HA' => [
                    ['query' => 'King of spades', 'is_base' => false],
                    ['query' => 'Ace of roses', 'is_base' => true],
                    ['query' => 'Queen of cups', 'is_base' => false],
                ],
                'HQ' => [
                    ['query' => '3 of pentacles', 'is_base' => false],
                    ['query' => '1 of Major Arcana', 'is_base' => false],
                    ['query' => 'Queen of cups', 'is_base' => true],
                ],
            ];

            foreach ($specialSets as $name => $special) {
                $hybrid = Hybrid::create([
                    'name' => $name,
                    'nb_like' => 0,
                    'img_src' => null,
                ]);

                $foundIds = [];
                foreach ($special as $item) {
                    // reuse flexible lookup
                    $card = Card::whereRaw('LOWER(french_equivalence) LIKE ?', ["%" . strtolower($item['query']) . "%"])->first()
                        ?? Card::whereRaw('LOWER(name) LIKE ?', ["%" . strtolower($item['query']) . "%"])->first()
                        ?? Card::whereRaw('LOWER(value) LIKE ?', ["%" . strtolower($item['query']) . "%"])->first()
                        ?? Card::whereRaw('LOWER(suits) LIKE ?', ["%" . strtolower($item['query']) . "%"])->first();

                    if ($card) {
                        $foundIds[] = ['id' => $card->id, 'is_base' => $item['is_base']];
                    } else {
                        $fallback = Card::inRandomOrder()->first();
                        if ($fallback) {
                            $foundIds[] = ['id' => $fallback->id, 'is_base' => $item['is_base']];
                            $this->command->warn("Could not find card matching '{$item['query']}', attached random card id {$fallback->id} instead for hybrid {$name}.");
                        }
                    }
                }

                if (count($foundIds) === 3) {
                    $attach = [];
                    foreach ($foundIds as $f) {
                        $attach[$f['id']] = ['is_base' => $f['is_base'] ? 1 : 0];
                    }
                    // ensure only these cards are attached (replace any existing attachments)
                    $hybrid->cards()->sync($attach);
                    $this->command->info("Created default hybrid {$hybrid->id} ({$name}) attached to cards: " . implode(',', array_column($foundIds, 'id')));
                } else {
                    $this->command->warn("Default hybrid {$name} could not find 3 matching cards; no attachments made.");
                }
            }

            // nothing else to do
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
                // HA: King of spades, Ace of roses (is_base), Queen of cups
                $special = [
                    ['query' => 'King of spades', 'is_base' => false],
                    ['query' => 'Ace of roses', 'is_base' => true],
                    ['query' => 'Queen of cups', 'is_base' => false],
                ];
            } elseif (strtolower($name) === 'hq') {
                // HQ: 3 of pentacles, The Magician (major arcana), Queen of cups (is_base)
                $special = [
                    ['query' => '3 of pentacles', 'is_base' => false],
                    ['query' => '1 of Major Arcana', 'is_base' => false],
                    ['query' => 'Queen of cups', 'is_base' => true],
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
