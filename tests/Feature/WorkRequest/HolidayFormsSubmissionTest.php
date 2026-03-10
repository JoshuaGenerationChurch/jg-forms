<?php

use App\Mail\WorkFormSubmissionNotificationMail;
use App\Mail\WorkFormTemplateNotificationMail;
use App\Models\User;
use App\Models\WorkRequestEntry;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

function grantHolidayFormsAdminAccess(User $user): void
{
    Permission::findOrCreate('forms.admin.access', 'web');
    Permission::findOrCreate('invitations.manage', 'web');

    $role = Role::findOrCreate('forms-admin', 'web');
    $role->syncPermissions(['forms.admin.access', 'invitations.manage']);

    $user->assignRole($role);
}

test('holiday forms pages are publicly accessible', function () {
    $this->get(route('forms.easter-holidays'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('forms/easter-holidays'));

    $this->get(route('forms.christmas-holidays'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('forms/christmas-holidays'));
});

test('guest can submit easter holidays service times and admin can view entry', function () {
    $admin = User::factory()->create(['email' => 'admin@example.com']);
    config(['services.recaptcha.enabled' => false]);
    grantHolidayFormsAdminAccess($admin);
    config(['workforms.easter_notification_recipients' => [
        ['email' => 'notify@example.com', 'name' => null],
        ['email' => 'trello@example.com', 'name' => 'JG Design'],
    ]]);
    config(['workforms.easter_notification_recipient_emails' => ['notify@example.com']]);
    Mail::fake();

    $payload = [
        'congregation' => 'City Bowl AM',
        'firstName' => 'Sam',
        'lastName' => 'Leader',
        'email' => 'sam@example.com',
        'cellphone' => '+27820000000',
        'selectedServiceTypes' => ['good_friday', 'easter_sunday'],
        'serviceTimes' => [
            [
                'serviceNameOption' => 'good_friday',
                'customServiceName' => '',
                'startTime' => '09:00',
                'venueType' => 'JG Venue',
                'jgVenue' => 'Venue 1',
                'otherVenueName' => '',
                'otherVenueAddress' => '',
                'congregationsInvolved' => ['City Bowl AM'],
                'graphicsLanguages' => ['English'],
                'hasSpecificTheme' => 'No',
                'themeDescription' => '',
            ],
            [
                'serviceNameOption' => 'easter_sunday',
                'customServiceName' => '',
                'startTime' => '09:00',
                'venueType' => 'Other',
                'jgVenue' => '',
                'otherVenueName' => 'Main Hall',
                'otherVenueAddress' => '12 Wingate Cres, Sunningdale, Cape Town',
                'congregationsInvolved' => ['City Bowl PM'],
                'graphicsLanguages' => ['English', 'Afrikaans'],
                'hasSpecificTheme' => 'Yes',
                'themeDescription' => 'Resurrection focus for evening attendees.',
            ],
            [
                'serviceNameOption' => 'good_friday',
                'customServiceName' => '',
                'startTime' => '09:00',
                'venueType' => 'JG Venue',
                'jgVenue' => 'Venue 1',
                'otherVenueName' => '',
                'otherVenueAddress' => '',
                'congregationsInvolved' => ['City Bowl PM'],
                'graphicsLanguages' => ['Afrikaans'],
                'hasSpecificTheme' => 'No',
                'themeDescription' => '',
            ],
        ],
    ];

    $response = $this->post(route('forms.easter-holidays.entries.store'), $payload);

    $response->assertRedirect();

    $this->assertDatabaseHas('work_request_entries', [
        'form_slug' => 'easter-holidays',
        'user_id' => null,
        'first_name' => 'Sam',
        'last_name' => 'Leader',
        'email' => 'sam@example.com',
        'congregation' => 'City Bowl AM',
    ]);

    $entry = WorkRequestEntry::query()
        ->where('form_slug', 'easter-holidays')
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->payload)->toBeArray();
    expect($entry->payload['serviceTimes'])->toHaveCount(2);
    expect($entry->payload['serviceTimes'][0]['serviceNameOption'])->toBe('good_friday');
    expect($entry->payload['serviceTimes'][0]['congregationsInvolved'])->toContain('City Bowl AM');
    expect($entry->payload['serviceTimes'][0]['congregationsInvolved'])->toContain('City Bowl PM');
    expect($entry->payload['serviceTimes'][0]['graphicsLanguages'])->toContain('English');
    expect($entry->payload['serviceTimes'][0]['graphicsLanguages'])->toContain('Afrikaans');

    Mail::assertQueued(WorkFormSubmissionNotificationMail::class, function (WorkFormSubmissionNotificationMail $mail): bool {
        return $mail->hasTo('notify@example.com')
            && $mail->entry->form_slug === 'easter-holidays';
    });

    Mail::assertNotQueued(WorkFormSubmissionNotificationMail::class, function (WorkFormSubmissionNotificationMail $mail): bool {
        return $mail->hasTo('trello@example.com')
            && $mail->entry->form_slug === 'easter-holidays';
    });
    Mail::assertQueued(WorkFormTemplateNotificationMail::class, function (WorkFormTemplateNotificationMail $mail): bool {
        return $mail->hasTo('sam@example.com')
            && str_contains($mail->subjectLine, 'Easter');
    });
    Mail::assertQueuedCount(2);

    $this->actingAs($admin)
        ->get(route('admin.forms.entries.show', 'easter-holidays'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/forms/entries')
            ->where('form.slug', 'easter-holidays')
            ->has('entries', 1)
        );

    $exportResponse = $this->actingAs($admin)
        ->get(route('admin.forms.entries.export', 'easter-holidays'));

    $exportResponse->assertOk();
    expect((string) $exportResponse->headers->get('content-type'))
        ->toContain('text/csv');
    expect($exportResponse->streamedContent())->toContain('Service Type');
    expect($exportResponse->streamedContent())->toContain('good_friday');
});
