<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Like extends Model
{
    use HasFactory;

    protected $fillable = [
        'hybrid_id',
        'device_id',
    ];

    public function hybrid()
    {
        return $this->belongsTo(Hybrid::class);
    }
}
