# Laravel Media Library

A robust media library management system for Laravel applications using Inertia.js and React. It provides a full-featured media manager with upload capabilities, variants (thumbnails), and a selector UI.

## Features

- **Media Management**: Upload, rename, and delete media files.
- **Variant Generation**: Automatic generation of thumbnails and webp variants (expandable).
- **Inertia/React Integration**: Ready-to-use components for selecting and managing media in your admin panel.
- **Filtering**: Filter media by type (image, video, document) and search by name.
- **Multi-delete**: Select and remove multiple files at once.
- **Google Drive Import (Public Links)**: Paste a public file/folder link, preview files, select some or all, and import in the background.

## Requirements

- PHP 8.2+
- Laravel 12.x | 13.x
- Inertia.js (React)

## Installation

You can install the package via composer:

```bash
composer require codprez/laravel-media-library
```

### Publish Configuration and Migrations

```bash
php artisan vendor:publish --tag="media-library-config"
php artisan vendor:publish --tag="media-library-migrations"
```

### Run Migrations

```bash
php artisan migrate
```

## Configuration

The configuration file is located at `config/media-library.php`. Here you can define the user model for relationships:

```php
return [
    'user_model' => \App\Models\User::class,
    'disk' => 'public',
    'google_drive' => [
        'api_key' => env('GOOGLE_DRIVE_API_KEY'),
    ],
];
```

### Google Drive Import Setup

To import public Google Drive folders, set an API key:

```env
GOOGLE_DRIVE_API_KEY=your_google_api_key
```

Then run migrations so import tracking columns/tables exist:

```bash
php artisan migrate
```

## Usage

### Backend

The package provides a `Media` model and a `MediaController`. By default, it uses the `public` disk for storage.

#### Handling Uploads

The `MediaController` includes a `store` method that handles file uploads and automatically generates metadata.

```php
// In your routes/web.php or routes/api.php
use Codprez\MediaLibrary\Http\Controllers\MediaController;

Route::post('/admin/media', [MediaController::class, 'store'])->name('admin.media.store');
```

### Frontend (Inertia + React)

The package includes React components located in `resources/js`. You can import and use them in your Inertia pages.

#### Component Example

```jsx
import { MediaSelector } from 'codprez/laravel-media-library';

function MyForm() {
    return (
        <MediaSelector 
            onSelect={(media) => console.log(media)}
            multiple={false}
        />
    );
}
```

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.
