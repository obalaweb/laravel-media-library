<?php

return [
    'user_model' => \App\Models\User::class,
    'disk' => 'public',

    'google_drive' => [
        'api_key' => env('GOOGLE_DRIVE_API_KEY'),
        'allowed_mime_types' => [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/svg+xml',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Routing Configuration
    |--------------------------------------------------------------------------
    */
    'routing' => [
        'prefix' => 'builder', // To match page builder by default, making it `/builder/media`
        'middleware' => ['web', 'auth'],
    ],
];
