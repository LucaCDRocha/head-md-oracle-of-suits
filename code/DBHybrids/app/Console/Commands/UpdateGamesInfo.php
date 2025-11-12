<?php

namespace App\Console\Commands;

use App\Models\Game;
use Illuminate\Console\Command;

class UpdateGamesInfo extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'games:update-info';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update year and description for games from config/decks.php';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Updating games information from config...');

        // Load deck information from config
        $decksInfo = config('decks.decks', []);

        if (empty($decksInfo)) {
            $this->warn('No deck information found in config/decks.php');
            return 1;
        }

        $updated = 0;
        $skipped = 0;

        // Get all games from database
        $games = Game::all();

        foreach ($games as $game) {
            // Check if we have deck information for this game
            if (isset($decksInfo[$game->name])) {
                $deckInfo = $decksInfo[$game->name];

                $game->year = $deckInfo['year'];
                $game->description = $deckInfo['description'];
                $game->save();

                $this->line("✓ Updated: {$game->name} ({$deckInfo['year']})");
                $updated++;
            } else {
                $this->comment("- Skipped: {$game->name} (no config entry)");
                $skipped++;
            }
        }

        $this->newLine();
        $this->info("✓ Updated {$updated} game(s)");
        if ($skipped > 0) {
            $this->comment("- Skipped {$skipped} game(s) without config entries");
        }

        return 0;
    }
}
