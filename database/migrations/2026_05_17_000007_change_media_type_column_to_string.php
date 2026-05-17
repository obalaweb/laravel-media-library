<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->string('type')->default('image')->change();
        });
    }

    public function down(): void
    {
        // No down migration needed as string accommodates all previous enum values
    }
};
