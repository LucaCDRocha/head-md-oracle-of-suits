<?php

namespace Database\Seeders;

use App\Models\Game;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;


class GamesTableSeeder extends Seeder
{
    public function run()
    {
        // Auto-create games from folders in storage/app/public/img/cards
        // Each subfolder name becomes a Game name (if not already present)
        $folders = Storage::disk('public')->directories('img/cards');
        foreach ($folders as $folder) {
            $gameName = pathinfo($folder, PATHINFO_BASENAME);
            if (! $gameName) {
                continue;
            }

            Game::firstOrCreate([
                'name' => $gameName,
            ], [
                'year' => now()->year,
                'description' => 'Auto-created game from folder ' . $gameName,
            ]);
        }
    }
}
