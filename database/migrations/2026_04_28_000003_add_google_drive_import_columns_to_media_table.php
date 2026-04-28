<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->string('source')->nullable()->after('type');
            $table->string('source_id')->nullable()->after('source');
            $table->unsignedBigInteger('import_batch_id')->nullable()->after('source_id');
            $table->timestamp('imported_at')->nullable()->after('import_batch_id');

            $table->index(['source', 'source_id']);
            $table->index('import_batch_id');
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropIndex(['source', 'source_id']);
            $table->dropIndex(['import_batch_id']);
            $table->dropColumn(['source', 'source_id', 'import_batch_id', 'imported_at']);
        });
    }
};
