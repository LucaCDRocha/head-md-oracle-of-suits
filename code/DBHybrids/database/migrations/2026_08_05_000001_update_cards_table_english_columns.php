<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('cards', function (Blueprint $table) {
            if (Schema::hasColumn('cards', 'french_suits') && !Schema::hasColumn('cards', 'suits_en')) {
                $table->renameColumn('french_suits', 'suits_en');
            }
            if (Schema::hasColumn('cards', 'french_value') && !Schema::hasColumn('cards', 'value_en')) {
                $table->renameColumn('french_value', 'value_en');
            }
            if (Schema::hasColumn('cards', 'french_equivalence') && !Schema::hasColumn('cards', 'name_en')) {
                $table->renameColumn('french_equivalence', 'name_en');
            }
        });
    }

    public function down()
    {
        Schema::table('cards', function (Blueprint $table) {
            if (Schema::hasColumn('cards', 'suits_en')) {
                $table->renameColumn('suits_en', 'french_suits');
            }
            if (Schema::hasColumn('cards', 'value_en')) {
                $table->renameColumn('value_en', 'french_value');
            }
            if (Schema::hasColumn('cards', 'name_en')) {
                $table->renameColumn('name_en', 'french_equivalence');
            }
        });
    }
};
