<?php

namespace Codprez\MediaLibrary\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaImportBatch extends Model
{
    protected $fillable = [
        'source',
        'source_folder_id',
        'status',
        'total_count',
        'pending_count',
        'processing_count',
        'imported_count',
        'failed_count',
        'skipped_count',
        'meta',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(config('media-library.user_model', \App\Models\User::class), 'created_by');
    }
}
