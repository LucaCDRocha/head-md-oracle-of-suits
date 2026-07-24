<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('hybrids', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('nb_like')->default(0);
            $table->string('img_src')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('hybrids');
    }
};
