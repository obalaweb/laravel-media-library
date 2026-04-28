<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->unique(['source', 'source_id'], 'media_source_source_id_unique');
        });

        Schema::table('media_import_batches', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('meta')->constrained('users')->nullOnDelete();
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::table('media_import_batches', function (Blueprint $table) {
            $table->dropIndex(['created_by']);
            $table->dropConstrainedForeignId('created_by');
        });

        Schema::table('media', function (Blueprint $table) {
            $table->dropUnique('media_source_source_id_unique');
        });
    }
};
