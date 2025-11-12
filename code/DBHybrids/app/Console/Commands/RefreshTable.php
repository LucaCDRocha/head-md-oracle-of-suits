<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RefreshTable extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'table:refresh {table} {--seeder=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Refresh a specific table by dropping and re-migrating it';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $table = $this->argument('table');
        $seeder = $this->option('seeder');

        // Confirm action
        if (!$this->confirm("This will drop the '{$table}' table and recreate it. Continue?", true)) {
            $this->info('Operation cancelled.');
            return 0;
        }

        // Special handling for cards table to preserve based_on relationships
        $basedOnBackup = [];
        if ($table === 'cards' && Schema::hasTable('based_on')) {
            $this->info("Backing up based_on relationships...");
            // Get relationships and convert to array, excluding the 'id' field
            $basedOnBackup = DB::table('based_on')
                ->select('card_id', 'hybrid_id', 'is_base', 'created_at', 'updated_at')
                ->get()
                ->toArray();
            $this->info("Backed up " . count($basedOnBackup) . " relationships");

            // Clear the based_on table
            $this->info("Clearing based_on table...");
            DB::table('based_on')->truncate();
        }

        // Disable foreign key checks temporarily
        $this->info("Disabling foreign key constraints...");
        DB::statement('PRAGMA foreign_keys = OFF');

        // Drop the table
        $this->info("Dropping table: {$table}");
        Schema::dropIfExists($table);

        // Find the migration file for this table
        $migrationName = "create_{$table}_table";
        $this->info("Looking for migration: {$migrationName}");

        // Remove from migrations table so it can run again
        DB::table('migrations')->where('migration', 'like', "%{$migrationName}%")->delete();

        // Re-run migrations
        $this->info("Running migrations...");
        Artisan::call('migrate', ['--force' => true]);
        $this->line(Artisan::output());

        // Seed if specified
        if ($seeder) {
            $this->info("Seeding with: {$seeder}");
            Artisan::call('db:seed', ['--class' => $seeder, '--force' => true]);
            $this->line(Artisan::output());
        }

        // Re-enable foreign key checks
        $this->info("Re-enabling foreign key constraints...");
        DB::statement('PRAGMA foreign_keys = ON');

        // Restore based_on relationships if they were backed up
        if (!empty($basedOnBackup)) {
            $this->info("Restoring based_on relationships...");
            $restored = 0;
            $failed = 0;

            foreach ($basedOnBackup as $relation) {
                try {
                    // Insert without the 'id' field to let it auto-increment
                    DB::table('based_on')->insert([
                        'card_id' => $relation->card_id,
                        'hybrid_id' => $relation->hybrid_id,
                        'is_base' => $relation->is_base,
                        'created_at' => $relation->created_at,
                        'updated_at' => $relation->updated_at,
                    ]);
                    $restored++;
                } catch (\Exception $e) {
                    $failed++;
                    // Only show detailed error for first few failures
                    if ($failed <= 3) {
                        $this->warn("Could not restore relationship for card_id {$relation->card_id}: " . $e->getMessage());
                    }
                }
            }

            $this->info("Restored {$restored} relationships" . ($failed > 0 ? " ({$failed} failed)" : ""));
        }

        $this->info("✓ Table '{$table}' refreshed successfully!");
        return 0;
    }
}
