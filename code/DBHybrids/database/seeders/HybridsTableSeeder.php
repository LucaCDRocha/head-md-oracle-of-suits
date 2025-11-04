<?php

namespace Database\Seeders;

use App\Models\Hybrid;
use Illuminate\Database\Seeder;

class HybridsTableSeeder extends Seeder
{
    public function run()
    {
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
    }
}
