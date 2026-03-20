<?php

namespace Codprez\MediaLibrary\Database\Factories;

use Codprez\MediaLibrary\Models\Media;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\Codprez\MediaLibrary\Models\Media>
 */
class MediaFactory extends Factory
{
    protected $model = Media::class;

    public function definition(): array
    {
        $seed = $this->faker->numberBetween(1, 1000);
        $width = $this->faker->numberBetween(800, 1920);
        $height = $this->faker->numberBetween(600, 1080);
        $fileName = $this->faker->slug(2).'.jpg';
        $url = "https://picsum.photos/seed/{$seed}/{$width}/{$height}";

        return [
            'name' => $this->faker->words(3, true),
            'original_name' => $fileName,
            'file_name' => $fileName,
            'mime_type' => 'image/jpeg',
            'type' => 'image',
            'path' => 'media/'.$fileName,
            'url' => $url,
            'size' => $this->faker->numberBetween(50000, 3000000),
            'uploaded_by' => config('media-library.user_model', \App\Models\User::class)::factory(),
            'thumbnail_path' => null,
            'thumbnail_url' => null,
            'medium_path' => null,
            'medium_url' => null,
            'large_path' => null,
            'large_url' => null,
            'webp_path' => null,
            'webp_url' => null,
        ];
    }

    public function withVariants(): static
    {
        return $this->state(function (array $attributes) {
            $base = pathinfo($attributes['file_name'], PATHINFO_FILENAME);

            return [
                'thumbnail_path' => "media/thumbnails/{$base}_thumb.jpg",
                'thumbnail_url' => $attributes['url'].'?w=150&h=150',
                'medium_path' => "media/medium/{$base}_medium.jpg",
                'medium_url' => $attributes['url'].'?w=640&h=480',
                'large_path' => "media/large/{$base}_large.jpg",
                'large_url' => $attributes['url'].'?w=1280&h=960',
                'webp_path' => "media/webp/{$base}.webp",
                'webp_url' => $attributes['url'].'?fm=webp',
            ];
        });
    }

    public function document(): static
    {
        return $this->state(function () {
            $fileName = $this->faker->slug(2).'.pdf';

            return [
                'original_name' => $fileName,
                'file_name' => $fileName,
                'mime_type' => 'application/pdf',
                'type' => 'document',
                'path' => 'media/'.$fileName,
                'url' => '/storage/media/'.$fileName,
                'size' => $this->faker->numberBetween(100000, 10000000),
                'thumbnail_path' => null,
                'thumbnail_url' => null,
                'medium_path' => null,
                'medium_url' => null,
                'large_path' => null,
                'large_url' => null,
                'webp_path' => null,
                'webp_url' => null,
            ];
        });
    }
}
