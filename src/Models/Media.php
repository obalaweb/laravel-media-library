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
 * @property int|null $width
 * @property int|null $height
 * @property-read string $formatted_size
 * @property-read string|null $dimensions
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
        'source',
        'source_id',
        'import_batch_id',
        'imported_at',
        'path',
        'url',
        'size',
        'width',
        'height',
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
            'width' => 'integer',
            'height' => 'integer',
            'imported_at' => 'datetime',
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

    public function importBatch(): BelongsTo
    {
        return $this->belongsTo(MediaImportBatch::class, 'import_batch_id');
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

    public function getDimensionsAttribute(): ?string
    {
        if ($this->width && $this->height) {
            $aspectRatio = $this->aspect_ratio;
            return $aspectRatio ? str_replace(':', 'x', $aspectRatio) : "{$this->width}x{$this->height}";
        }

        return null;
    }

    public function getAspectRatioAttribute(): ?string
    {
        if (!$this->width || !$this->height) {
            return null;
        }

        $gcd = function ($a, $b) use (&$gcd) {
            return $b ? $gcd($b, $a % $b) : $a;
        };

        $divisor = $gcd($this->width, $this->height);

        $w = $this->width / $divisor;
        $h = $this->height / $divisor;

        return "{$w}:{$h}";
    }

    public function getOptimizedUrl(string $size = 'medium'): ?string
    {
        if ($this->type === 'video' && $size === 'thumbnail') {
            return $this->thumbnail_url ?? $this->url;
        }

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

    public static function getTypeFromMime(string $mimeType, ?string $filename = null): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }

        if (str_starts_with($mimeType, 'video/')) {
            return 'video';
        }

        if (str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        }

        if (str_starts_with($mimeType, 'application/pdf') ||
            str_starts_with($mimeType, 'application/msword') ||
            str_starts_with($mimeType, 'application/vnd')) {
            return 'document';
        }

        // Handle generic mime types by checking extension
        if ($filename && ($mimeType === 'application/octet-stream' || $mimeType === 'binary/octet-stream' || empty($mimeType))) {
            $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

            $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'];
            if (in_array($extension, $imageExtensions)) {
                return 'image';
            }

            $videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'm4v', '3gp'];
            if (in_array($extension, $videoExtensions)) {
                return 'video';
            }

            $audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
            if (in_array($extension, $audioExtensions)) {
                return 'audio';
            }
        }

        return 'document';
    }
}
