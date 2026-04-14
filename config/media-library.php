<?php

return [
    'user_model' => \App\Models\User::class,

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
