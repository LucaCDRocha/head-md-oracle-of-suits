<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hybrid extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'nb_like',
        'img_src',
    ];

    public function cards()
    {
        return $this->belongsToMany(Card::class, 'based_on')
            ->withPivot('is_base')
            ->withTimestamps();
    }
}
