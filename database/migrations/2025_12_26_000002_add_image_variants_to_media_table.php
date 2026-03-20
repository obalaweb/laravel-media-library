<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->string('thumbnail_path')->nullable()->after('path');
            $table->string('thumbnail_url')->nullable()->after('url');
            $table->string('medium_path')->nullable()->after('thumbnail_path');
            $table->string('medium_url')->nullable()->after('thumbnail_url');
            $table->string('large_path')->nullable()->after('medium_path');
            $table->string('large_url')->nullable()->after('medium_url');
            $table->string('webp_path')->nullable()->after('large_path');
            $table->string('webp_url')->nullable()->after('large_url');
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropColumn([
                'thumbnail_path', 'thumbnail_url',
                'medium_path', 'medium_url',
                'large_path', 'large_url',
                'webp_path', 'webp_url',
            ]);
        });
    }
};
