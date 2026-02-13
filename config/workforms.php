<?php

$adminEmails = array_filter(array_map(
    static fn (string $email): string => strtolower(trim($email)),
    explode(',', (string) env('WORK_FORMS_ADMIN_EMAILS', ''))
));

return [
    'admin_emails' => array_values(array_unique($adminEmails)),
    'forms' => [
        [
            'slug' => 'work-request',
            'title' => 'Work Request Form',
            'description' => 'Event logistics, registration, digital media, print media, and signage requests.',
            'url' => '/work-request',
        ],
        [
            'slug' => 'easter-holidays',
            'title' => 'Easter Holidays Service Times',
            'description' => 'Collect congregation service times across the Easter holiday period.',
            'url' => '/forms/easter-holidays',
        ],
        [
            'slug' => 'christmas-holidays',
            'title' => 'Christmas Holidays Service Times',
            'description' => 'Collect congregation service times across the Christmas holiday period.',
            'url' => '/forms/christmas-holidays',
        ],
    ],
];
