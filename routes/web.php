<?php

use Codprez\MediaLibrary\Http\Controllers\MediaController;
use Illuminate\Support\Facades\Route;

$prefix = config('media-library.routing.prefix', 'builder');
$middleware = config('media-library.routing.middleware', ['web', 'auth']);

Route::middleware($middleware)
    ->prefix($prefix)
    ->name('admin.') // Prefixing with admin to remain compatible with existing internal route names
    ->group(function () {
        Route::get('media', [MediaController::class, 'index'])->name('media.index');
        Route::post('media', [MediaController::class, 'store'])->name('media.store');
        Route::get('media/{medium}', [MediaController::class, 'show'])->name('media.show');
        Route::put('media/{medium}', [MediaController::class, 'update'])->name('media.update');
        Route::delete('media', [MediaController::class, 'destroyMultiple'])->name('media.destroy-multiple');
        Route::delete('media/{medium}', [MediaController::class, 'destroy'])->name('media.destroy');
    });
