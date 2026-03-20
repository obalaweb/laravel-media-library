<?php

namespace Codprez\MediaLibrary;

use Illuminate\Support\ServiceProvider;

class MediaLibraryServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->publishes([
            __DIR__.'/../config/media-library.php' => config_path('media-library.php'),
        ], 'media-library-config');

        $this->publishes([
            __DIR__.'/../database/migrations/' => database_path('migrations'),
        ], 'media-library-migrations');
    }

    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/media-library.php', 'media-library');
    }
}
