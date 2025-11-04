<?php

namespace Database\Seeders;

use App\Models\Card;
use App\Models\Game;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CardsTableSeeder extends Seeder
{
    public function run()
    {
        $processedDecks = [];
        $unknownTokens = [];

        // Global equivalences (groups) from config - used to populate french equivalents
        $equivalences = config('decks.equivalences', []);
        $globalValuesFr = [];
        $globalSuitsFr = [];
        if (! empty($equivalences)) {
            // values groups
            $groups = $equivalences['values_groups'] ?? [];
            foreach ($groups as $g) {
                $to = $g['to'] ?? null;
                $tokens = $g['tokens'] ?? [];
                foreach ($tokens as $t) {
                    $globalValuesFr[strtoupper($t)] = $to;
                }
            }
            // suits groups
            $sg = $equivalences['suits_groups'] ?? [];
            foreach ($sg as $g) {
                $to = $g['to'] ?? null;
                $tokens = $g['tokens'] ?? [];
                foreach ($tokens as $t) {
                    $globalSuitsFr[strtoupper($t)] = $to;
                }
            }
        }

        // Games are created by GamesTableSeeder. CardsTableSeeder will look up games by folder name.

        // Look for subfolders in the public disk under img/cards — each folder is a game name
        $folders = Storage::disk('public')->directories('img/cards');

        foreach ($folders as $folder) {
            $gameName = pathinfo($folder, PATHINFO_BASENAME);
            if (! $gameName) {
                continue;
            }

            // Find existing game by folder name. Games should be created by GamesTableSeeder.
            $game = Game::firstWhere('name', $gameName);
            if (! $game) {
                if (method_exists($this, 'command') && $this->command) {
                    $this->command->warn("Game '{$gameName}' not found — skipping cards in folder '{$folder}'. Run GamesTableSeeder first to create games automatically.");
                }
                continue;
            }

            // Determine preset mapping (from config/decks.php) if available
            $presets = config('decks.presets', []);
            $matchedPreset = null;
            $gameNameLower = strtolower($gameName);
            foreach ($presets as $presetKey => $preset) {
                $aliases = $preset['aliases'] ?? [];
                foreach ($aliases as $alias) {
                    if ($alias && stripos($gameNameLower, strtolower($alias)) !== false) {
                        $matchedPreset = $preset;
                        break 2;
                    }
                }
            }

            if ($matchedPreset) {
                $processedDecks[] = $gameName;
            }

            $files = Storage::disk('public')->files($folder);

            foreach ($files as $file) {
                // Skip non-image files just in case
                $ext = pathinfo($file, PATHINFO_EXTENSION);
                if (! in_array(strtolower($ext), ['png', 'jpg', 'jpeg', 'gif', 'svg'])) {
                    continue;
                }

                // Avoid duplicate seeds
                if (Card::where('img_src', $file)->exists()) {
                    continue;
                }
                $filename = pathinfo($file, PATHINFO_FILENAME);
                $isSpecialSuit = false;

                // Handle special cards first (joker, back, backside)
                $lowerFilename = strtolower($filename);
                if (str_contains($lowerFilename, 'joker')) {
                    // Joker: no suit
                    $suitFull = 'Special';
                    $valueToken = 'JOKER';
                    $name = Str::of($filename)->replace(['-', '_'], ' ')->title();

                    Card::create([
                        'name' => (string) $name,
                        'game_id' => $game->id,
                        'suits' => $suitFull,
                        'value' => $valueToken,
                        'img_src' => $file,
                        'french_equivalence' => 'Joker',
                    ]);

                    continue;
                }

                if (str_contains($lowerFilename, 'back') || str_contains($lowerFilename, 'reverse') || str_contains($lowerFilename, 'backside')) {
                    // Back card: treat as special, no suit/value
                    $suitFull = null;
                    $valueToken = null;
                    $name = Str::of($filename)->replace(['-', '_'], ' ')->title();

                    Card::create([
                        'name' => (string) $name,
                        'game_id' => $game->id,
                        'suits' => $suitFull,
                        'value' => $valueToken,
                        'img_src' => $file,
                        'french_equivalence' => null,
                    ]);

                    continue;
                }

                // parse filename: expected format: <suitInitial><value> (e.g. S2, H10, DK, CA)
                // allow separators like -, _, or space: e.g. S-2, H_10
                $clean = preg_replace('/[^A-Za-z0-9]/', '', $filename);
                if (strlen($clean) < 2) {
                    // fallback to friendly name
                    $name = Str::of($filename)->replace(['-', '_'], ' ')->title();
                    $suitFull = null;
                    $valueToken = null;
                } else {
                    $suitInitial = strtoupper(substr($clean, 0, 1));
                    $valueToken = strtoupper(substr($clean, 1));

                    // Default suits map (standard playing cards)
                    $suitsMap = [
                        'S' => 'Spades',
                        'H' => 'Hearts',
                        'D' => 'Diamonds',
                        'C' => 'Clubs',
                    ];

                    // If a preset was matched, start from its suits/values
                    if ($matchedPreset) {
                        if (! empty($matchedPreset['suits']) && is_array($matchedPreset['suits'])) {
                            $suitsMap = $matchedPreset['suits'];
                        }
                    }

                    // Allow per-folder override: if a suits.json file exists in the folder,
                    // it should contain a JSON object mapping initials to full names,
                    // e.g. { "P": "Pentacles", "C": "Cups" }
                    $suitsJsonPath = $folder . '/suits.json';
                    if (Storage::disk('public')->exists($suitsJsonPath)) {
                        try {
                            $contents = Storage::disk('public')->get($suitsJsonPath);
                            $custom = json_decode($contents, true);
                            if (is_array($custom)) {
                                // normalize keys to uppercase single-letter
                                $customNormalized = [];
                                foreach ($custom as $k => $v) {
                                    $customNormalized[strtoupper($k)] = $v;
                                }
                                // merge custom over defaults
                                $suitsMap = array_merge($suitsMap, $customNormalized);
                            }
                        } catch (\Throwable $e) {
                            // ignore malformed JSON and continue with defaults
                        }
                    }

                    $suitFull = $suitsMap[$suitInitial] ?? null;

                    // Prepare French suit mapping: check preset, then per-folder suits_fr.json, then defaults
                    $suitsFrMap = [
                        'S' => 'Pique',
                        'H' => 'Coeur',
                        'D' => 'Carreau',
                        'C' => 'Trefle',
                    ];
                    // merge global equivalences (lowest priority) so presets and per-folder can override
                    if (! empty($globalSuitsFr)) {
                        $suitsFrMap = array_merge($globalSuitsFr, $suitsFrMap);
                    }
                    if ($matchedPreset && ! empty($matchedPreset['suits_fr']) && is_array($matchedPreset['suits_fr'])) {
                        $suitsFrMap = array_merge($suitsFrMap, $matchedPreset['suits_fr']);
                    }
                    $suitsFrJsonPath = $folder . '/suits_fr.json';
                    if (Storage::disk('public')->exists($suitsFrJsonPath)) {
                        try {
                            $contents = Storage::disk('public')->get($suitsFrJsonPath);
                            $custom = json_decode($contents, true);
                            if (is_array($custom)) {
                                $customNormalized = [];
                                foreach ($custom as $k => $v) {
                                    $customNormalized[strtoupper($k)] = $v;
                                }
                                $suitsFrMap = array_merge($suitsFrMap, $customNormalized);
                            }
                        } catch (\Throwable $e) {
                            // ignore malformed JSON
                        }
                    }
                    // Lookup French suit name using multiple candidates to handle
                    // ambiguous initials — try initial and the full English suit name.
                    $suitFr = null;
                    $candidates = [];
                    if (! empty($suitInitial)) {
                        $candidates[] = strtoupper($suitInitial);
                    }
                    if (! empty($suitFull)) {
                        $candidates[] = strtoupper($suitFull);
                    }
                    // also include a normalized english form without spaces
                    if (! empty($suitFull)) {
                        $candidates[] = strtoupper(str_replace(' ', '', $suitFull));
                    }

                    foreach ($candidates as $key) {
                        if (isset($suitsFrMap[$key])) {
                            $suitFr = $suitsFrMap[$key];
                            break;
                        }
                    }

                    // If this suit is considered 'Special' (major arcana, etc.), mark it so
                    // that we set its equivalence to 'Joker' later, but do NOT change the
                    // parsed suit or value — keep original data.
                    $suitLower = strtolower((string) $suitFull);
                    $suitFrLower = strtolower((string) $suitFr);
                    $isSpecialSuit = in_array($suitLower, ['special', 'major arcana', 'majorarcana', 'arcanes majeurs', 'arcanesmajeurs'])
                        || in_array($suitFrLower, ['special', 'major arcana', 'majorarcana', 'arcanes majeurs', 'arcanesmajeurs'])
                        || strtoupper($suitInitial) === 'M';

                    // Map face values to names (default)
                    $faces = [
                        'A' => 'Ace',
                        'K' => 'King',
                        'Q' => 'Queen',
                        'J' => 'Jack',
                    ];

                    // If a preset was matched, merge its values
                    if ($matchedPreset && ! empty($matchedPreset['values']) && is_array($matchedPreset['values'])) {
                        $faces = array_merge($faces, $matchedPreset['values']);
                    }

                    // Allow per-folder override: values.json in the folder mapping tokens to full names
                    $valuesJsonPath = $folder . '/values.json';
                    if (Storage::disk('public')->exists($valuesJsonPath)) {
                        try {
                            $contents = Storage::disk('public')->get($valuesJsonPath);
                            $custom = json_decode($contents, true);
                            if (is_array($custom)) {
                                $customNormalized = [];
                                foreach ($custom as $k => $v) {
                                    $customNormalized[strtoupper($k)] = $v;
                                }
                                $faces = array_merge($faces, $customNormalized);
                            }
                        } catch (\Throwable $e) {
                            // ignore malformed JSON
                        }
                    }

                    // Resolve value token to a human friendly name
                    if ($valueToken === null) {
                        $valueName = null;
                    } elseif (isset($faces[$valueToken])) {
                        $valueName = $faces[$valueToken];
                    } elseif (is_numeric($valueToken)) {
                        $valueName = $valueToken;
                    } else {
                        // Unknown token — keep token as name and warn for visibility
                        $valueName = $valueToken;
                        $unknownTokens[] = [
                            'game' => $gameName,
                            'file' => $file,
                            'token' => $valueToken,
                        ];
                        if (method_exists($this, 'command') && $this->command) {
                            $this->command->warn("Unknown value token '{$valueToken}' in file '{$file}' for game '{$gameName}'");
                        }
                    }

                    $name = $valueName . ($suitFull ? ' of ' . $suitFull : '');
                }

                // Determine French equivalence for this card
                $valueFr = null;
                // check for preset values_fr
                if ($matchedPreset && ! empty($matchedPreset['values_fr']) && is_array($matchedPreset['values_fr'])) {
                    $valueFr = $matchedPreset['values_fr'][($valueToken ?? '')] ?? null;
                }
                // check per-folder values_fr.json
                $valuesFrJsonPath = $folder . '/values_fr.json';
                if (Storage::disk('public')->exists($valuesFrJsonPath)) {
                    try {
                        $contents = Storage::disk('public')->get($valuesFrJsonPath);
                        $custom = json_decode($contents, true);
                        if (is_array($custom)) {
                            $customNormalized = [];
                            foreach ($custom as $k => $v) {
                                $customNormalized[strtoupper($k)] = $v;
                            }
                            if (isset($customNormalized[strtoupper($valueToken ?? '')])) {
                                $valueFr = $customNormalized[strtoupper($valueToken ?? '')];
                            }
                        }
                    } catch (\Throwable $e) {
                        // ignore malformed JSON
                    }
                }

                // fallback French names for common tokens
                if ($valueFr === null && $valueToken !== null) {
                    $fallbackFr = [
                        'A' => 'As',
                        'K' => 'Roi',
                        'Q' => 'Dame',
                        'J' => 'Valet',
                        'P' => 'Page',
                        'C' => 'Cavalier',
                        'R' => 'Roi',
                        'D' => 'Dame',
                        'V' => 'Valet',
                        'U' => 'Unter',
                        'JOKER' => 'Joker',
                    ];
                    // merge global equivalences (lower priority than per-preset/per-folder)
                    // but allow global mappings to override our hardcoded fallbacks
                    if (! empty($globalValuesFr)) {
                        $fallbackFr = array_merge($fallbackFr, $globalValuesFr);
                    }
                    if (isset($fallbackFr[$valueToken])) {
                        $valueFr = $fallbackFr[$valueToken];
                    } elseif (is_numeric($valueToken)) {
                        $valueFr = $valueToken;
                    }
                }

                $frenchEquivalence = null;
                if ($valueFr) {
                    $frenchEquivalence = $valueFr . ($suitFr ? ' de ' . $suitFr : '');
                } elseif ($suitFr) {
                    // no value but suit exists (unlikely) — just show suit
                    $frenchEquivalence = $suitFr;
                }

                // If this card belongs to a special suit (major arcana etc.),
                // mark its equivalence as Joker but keep original suits/value.
                if (! empty($isSpecialSuit)) {
                    $frenchEquivalence = 'Joker';
                }

                Card::create([
                    'name' => (string) $name,
                    'game_id' => $game->id,
                    'suits' => $suitFull,
                    'value' => $valueToken ?? null,
                    'img_src' => $file,
                    'french_equivalence' => $frenchEquivalence,
                ]);
            }
        }
        // After processing, print a summary when running via artisan
        if (method_exists($this, 'command') && $this->command) {
            if (! empty($processedDecks)) {
                $this->command->info('Processed decks: ' . implode(', ', array_unique($processedDecks)));
            }

            if (! empty($unknownTokens)) {
                $this->command->warn('Unknown value tokens encountered:');
                foreach ($unknownTokens as $u) {
                    $this->command->line(" - {$u['token']} in {$u['file']} (game: {$u['game']})");
                }
            } else {
                $this->command->info('No unknown tokens encountered.');
            }
        }
    }
}
