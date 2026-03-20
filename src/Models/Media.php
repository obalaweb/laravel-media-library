<?php

namespace Codprez\MediaLibrary\Models;

use Codprez\MediaLibrary\Database\Factories\MediaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 *
 * @property int $id
 * @property string $name
 * @property string $original_name
 * @property string $file_name
 * @property string $mime_type
 * @property string $type
 * @property string $path
 * @property string $url
 * @property int $size
 * @property int|null $uploaded_by
 * @property string|null $thumbnail_path
 * @property string|null $thumbnail_url
 * @property string|null $medium_path
 * @property string|null $medium_url
 * @property string|null $large_path
 * @property string|null $large_url
 * @property string|null $webp_path
 * @property string|null $webp_url
 * @property-read string $formatted_size
 */
class Media extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'original_name',
        'file_name',
        'mime_type',
        'type',
        'path',
        'url',
        'size',
        'uploaded_by',
        'thumbnail_path',
        'thumbnail_url',
        'medium_path',
        'medium_url',
        'large_path',
        'large_url',
        'webp_path',
        'webp_url',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    protected static function newFactory(): MediaFactory
    {
        return MediaFactory::new();
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(config('media-library.user_model', \App\Models\User::class), 'uploaded_by');
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2).' '.$units[$i];
    }

    public function getOptimizedUrl(string $size = 'medium'): ?string
    {
        if ($this->type !== 'image') {
            return $this->url;
        }

        return match ($size) {
            'thumbnail' => $this->thumbnail_url ?? $this->url,
            'medium' => $this->medium_url ?? $this->webp_url ?? $this->url,
            'large' => $this->large_url ?? $this->webp_url ?? $this->url,
            'webp' => $this->webp_url ?? $this->url,
            default => $this->webp_url ?? $this->url,
        };
    }

    public function getImageVariants(): array
    {
        if ($this->type !== 'image') {
            return [];
        }

        return [
            'original' => $this->url,
            'thumbnail' => $this->thumbnail_url,
            'medium' => $this->medium_url,
            'large' => $this->large_url,
            'webp' => $this->webp_url,
        ];
    }
}
