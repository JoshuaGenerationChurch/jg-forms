<?php

$adminEmails = array_filter(array_map(
    static fn (string $email): string => strtolower(trim($email)),
    explode(',', (string) env('WORK_FORMS_ADMIN_EMAILS', ''))
));

$notificationRecipientsRaw = array_filter(array_map(
    static fn (string $recipient): string => trim($recipient),
    explode(';', (string) env(
        'WORK_FORMS_NOTIFICATION_RECIPIENTS',
        'hanri.delafontyn@joshgen.org.za;carinerugorirwera@gmail.com;"JG Design" <hanridelafontyn+ywj7ndnvhphschkmhmsf@boards.trello.com>;"JG Dev" <hanridelafontyn+3s3aaui7fwhyk4itwphz@boards.trello.com>'
    ))
));

$notificationRecipientsByEmail = [];

foreach ($notificationRecipientsRaw as $recipient) {
    $name = null;
    $email = $recipient;

    if (preg_match('/^\s*"?(?<name>[^"<]+?)"?\s*<(?<email>[^>]+)>\s*$/', $recipient, $matches) === 1) {
        $nameCandidate = trim((string) ($matches['name'] ?? ''));
        $name = $nameCandidate !== '' ? $nameCandidate : null;
        $email = trim((string) ($matches['email'] ?? ''));
    }

    $email = strtolower(trim($email));
    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        continue;
    }

    $notificationRecipientsByEmail[$email] = [
        'email' => $email,
        'name' => $name,
    ];
}

return [
    'admin_emails' => array_values(array_unique($adminEmails)),
    'notification_recipients' => array_values($notificationRecipientsByEmail),
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
