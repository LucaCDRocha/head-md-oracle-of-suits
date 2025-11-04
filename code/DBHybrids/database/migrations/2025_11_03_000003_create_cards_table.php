<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('game_id')->constrained('games')->onDelete('cascade');
            $table->string('suits')->nullable();
            $table->string('value')->nullable();
            $table->string('img_src')->nullable();
            $table->string('french_equivalence')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('cards');
    }
};
