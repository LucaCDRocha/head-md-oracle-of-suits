<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('games', function (Blueprint $table) {
            if (!Schema::hasColumn('games', 'name_en')) {
                $table->string('name_en')->nullable()->after('name');
            }
            if (!Schema::hasColumn('games', 'year_en')) {
                $table->string('year_en')->nullable()->after('year');
            }
        });
    }

    public function down()
    {
        Schema::table('games', function (Blueprint $table) {
            if (Schema::hasColumn('games', 'name_en')) {
                $table->dropColumn('name_en');
            }
            if (Schema::hasColumn('games', 'year_en')) {
                $table->dropColumn('year_en');
            }
        });
    }
};
