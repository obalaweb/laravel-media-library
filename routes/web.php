<?php

use Codprez\MediaLibrary\Http\Controllers\MediaController;
use Codprez\MediaLibrary\Http\Controllers\GoogleDriveImportController;
use Illuminate\Support\Facades\Route;

$prefix = config('media-library.routing.prefix', 'builder');
$middleware = config('media-library.routing.middleware', ['web', 'auth']);

Route::middleware($middleware)
    ->prefix($prefix)
    ->name('media-library.') // Changed from admin. to avoid duplicate route name conflicts with main app during caching
    ->group(function () {
        Route::get('media', [MediaController::class, 'index'])->name('media.index');
        Route::post('media', [MediaController::class, 'store'])->name('media.store');
        Route::get('media/{medium}', [MediaController::class, 'show'])->name('media.show');
        Route::put('media/{medium}', [MediaController::class, 'update'])->name('media.update');
        Route::delete('media', [MediaController::class, 'destroyMultiple'])->name('media.destroy-multiple');
        Route::delete('media/{medium}', [MediaController::class, 'destroy'])->name('media.destroy');
        Route::post('media/imports/google-drive/preview', [GoogleDriveImportController::class, 'preview'])->name('media.imports.google-drive.preview');
        Route::post('media/imports/google-drive/start', [GoogleDriveImportController::class, 'start'])->name('media.imports.google-drive.start');
        Route::get('media/imports/{batch}', [GoogleDriveImportController::class, 'status'])->name('media.imports.status');
    });
