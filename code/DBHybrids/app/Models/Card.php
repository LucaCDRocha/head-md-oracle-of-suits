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
        'french_equivalence',
    ];

    // append computed attributes to JSON
    protected $appends = ['image_url'];

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

    /**
     * Return the publicly accessible URL for the stored image (public disk).
     */
    public function getImageUrlAttribute()
    {
        if (! $this->img_src) {
            return null;
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url($this->img_src);
    }
}
