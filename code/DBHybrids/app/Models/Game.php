<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_en',
        'year',
        'year_en',
        'description',
        'description_eng',
        'nb_cards',
        'type',
        'suits_type',
    ];

    public function cards()
    {
        return $this->hasMany(Card::class);
    }
}
