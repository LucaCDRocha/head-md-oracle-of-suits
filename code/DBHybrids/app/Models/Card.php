<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'game_id',
        'suits',
        'value',
        'img_src',
        'french_suits',
        'french_value',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function hybrids()
    {
        return $this->belongsToMany(Hybrid::class, 'based_on')
            ->withPivot('is_base')
            ->withTimestamps();
    }
}
