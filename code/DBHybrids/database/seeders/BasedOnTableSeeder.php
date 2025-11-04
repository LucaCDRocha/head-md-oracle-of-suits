<?php

namespace Database\Seeders;

use App\Models\Card;
use App\Models\Hybrid;
use Illuminate\Database\Seeder;

class BasedOnTableSeeder extends Seeder
{
    public function run()
    {
        $card = Card::first();
        $hybrid = Hybrid::first();

        if ($card && $hybrid) {
            $card->hybrids()->attach($hybrid->id, ['is_base' => true]);
        }
    }
}
