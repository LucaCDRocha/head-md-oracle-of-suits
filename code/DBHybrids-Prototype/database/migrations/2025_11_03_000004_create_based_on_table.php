<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('based_on', function (Blueprint $table) {
            $table->id();
            $table->foreignId('card_id')->constrained('cards')->onDelete('cascade');
            $table->foreignId('hybrid_id')->constrained('hybrids')->onDelete('cascade');
            $table->boolean('is_base')->default(false);
            $table->timestamps();

            $table->unique(['card_id', 'hybrid_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('based_on');
    }
};
