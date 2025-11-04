<?php

namespace Database\Seeders;

use App\Models\Card;
use App\Models\Hybrid;
use Illuminate\Database\Seeder;

class BasedOnTableSeeder extends Seeder
{
    public function run()
    {
        // $card = Card::first();
        // $hybrid = Hybrid::first();

        // // Only attach an example based_on relation in local environment to avoid
        // // polluting production data. If you want deterministic examples in tests,
        // // run this seeder manually in your local env.
        // if (app()->environment('local') && $card && $hybrid) {
        //     $card->hybrids()->syncWithoutDetaching([$hybrid->id => ['is_base' => true]]);
        // }
    }
}
