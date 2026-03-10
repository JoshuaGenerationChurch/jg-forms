<?php

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

$easterNotificationRecipientsRaw = array_filter(array_map(
    static fn (string $recipient): string => trim($recipient),
    explode(';', (string) env(
        'WORK_FORMS_EASTER_NOTIFICATION_RECIPIENTS',
        'hanri.delafontyn@joshgen.org.za;carine.rugorirwera@joshgen.org.za;milo.bridgens@joshgen.org.za'
    ))
));

$easterNotificationRecipientsByEmail = [];

foreach ($easterNotificationRecipientsRaw as $recipient) {
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

    $easterNotificationRecipientsByEmail[$email] = [
        'email' => $email,
        'name' => $name,
    ];
}

$trelloDevRecipientEmails = array_values(array_filter(array_unique(array_filter(array_map(
    static fn (string $email): string => strtolower(trim($email)),
    preg_split('/[;,]/', (string) env(
        'WORK_FORMS_TRELLO_DEV_RECIPIENTS',
        'hanridelafontyn+3s3aaui7fwhyk4itwphz@boards.trello.com'
    )) ?: []
), static fn (string $email): bool => filter_var($email, FILTER_VALIDATE_EMAIL) !== false))));

$trelloDesignRecipientEmails = array_values(array_filter(array_unique(array_filter(array_map(
    static fn (string $email): string => strtolower(trim($email)),
    preg_split('/[;,]/', (string) env(
        'WORK_FORMS_TRELLO_DESIGN_RECIPIENTS',
        'hanridelafontyn+ywj7ndnvhphschkmhmsf@boards.trello.com'
    )) ?: []
), static fn (string $email): bool => filter_var($email, FILTER_VALIDATE_EMAIL) !== false))));

return [
    'invite_only_registration' => (bool) env('WORK_FORMS_INVITE_ONLY_REGISTRATION', true),
    'default_invitation_role' => (string) env('WORK_FORMS_DEFAULT_INVITED_ROLE', 'forms-admin'),
    'invitation_expiry_days' => (int) env('WORK_FORMS_INVITATION_EXPIRY_DAYS', 7),
    'public_entry_edit_link_expiry_days' => (int) env('WORK_FORMS_PUBLIC_ENTRY_EDIT_LINK_EXPIRY_DAYS', 30),
    'mail_queue_connection' => (string) env('WORK_FORMS_MAIL_QUEUE_CONNECTION', 'background'),
    'notification_recipients' => array_values($notificationRecipientsByEmail),
    'easter_notification_recipients' => array_values($easterNotificationRecipientsByEmail),
    'easter_notification_recipient_emails' => array_keys($easterNotificationRecipientsByEmail),
    'trello_dev_recipient_emails' => $trelloDevRecipientEmails,
    'trello_design_recipient_emails' => $trelloDesignRecipientEmails,
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
