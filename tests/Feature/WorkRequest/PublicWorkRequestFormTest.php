<?php

use App\Mail\WorkFormSubmissionNotificationMail;
use App\Models\WorkRequestEntry;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

test('work request form is publicly accessible', function () {
    $this->get(route('work-request'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('work-request-tabs'));
});

test('guest can submit a public work request entry', function () {
    config()->set('services.recaptcha.enabled', false);
    config()->set('workforms.notification_recipients', [
        ['email' => 'notify@example.com', 'name' => 'Notify'],
    ]);
    Mail::fake();

    $payload = [
        'firstName' => 'Jane',
        'lastName' => 'Doe',
        'email' => 'jane@example.com',
        'cellphone' => '+27820000000',
        'congregation' => 'City Bowl AM',
        'eventName' => 'Sunday Service',
        'eventScheduleType' => 'Single/Multiple Day Event',
        'announcementDate' => now()->addDays(7)->toDateString(),
        'venueType' => 'JG Venue',
        'jgVenue' => 'Venue 1',
        'eventReach' => 'South Africa',
        'childMinding' => 'No',
        'quicketDescription' => 'Registration details',
        'ticketCurrency' => 'ZAR',
        'ticketPriceIncludesFee' => 'Yes',
        'allowDonations' => 'No',
        'registrationClosingDate' => now()->addDays(10)->toDateString(),
        'digitalGraphicType' => 'Other',
        'digitalOtherGraphicDescription' => 'Event creative',
        'digitalFormatWhatsapp' => true,
        'termsAccepted' => true,
        'includesDatesVenue' => true,
        'includesRegistration' => true,
        'includesGraphics' => true,
        'includesGraphicsDigital' => true,
        'includesGraphicsPrint' => false,
        'includesSignage' => false,
    ];

    $response = $this
        ->from(route('work-request'))
        ->post(route('work-request.entries.store'), [
            'payload' => $payload,
        ]);

    $response->assertRedirect(route('work-request'));

    $this->assertDatabaseHas('work_request_entries', [
        'user_id' => null,
        'form_slug' => 'work-request',
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'email' => 'jane@example.com',
        'includes_dates_venue' => 1,
        'includes_registration' => 1,
        'includes_graphics_digital' => 1,
    ]);

    $entry = WorkRequestEntry::query()
        ->where('form_slug', 'work-request')
        ->whereNull('user_id')
        ->latest()
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->payload)->toBeArray();
    expect($entry->payload['eventName'])->toBe('Sunday Service');
    expect($entry->payload['ticketCurrency'])->toBe('ZAR');

    Mail::assertQueued(WorkFormSubmissionNotificationMail::class, function (WorkFormSubmissionNotificationMail $mail): bool {
        return $mail->hasTo('notify@example.com')
            && $mail->entry->form_slug === 'work-request';
    });
    Mail::assertQueuedCount(1);
});

test('public work request submission is rejected when no request type is selected', function () {
    config()->set('services.recaptcha.enabled', false);

    $payload = [
        'firstName' => 'Jane',
        'lastName' => 'Doe',
        'email' => 'jane@example.com',
        'cellphone' => '+27820000000',
        'congregation' => 'City Bowl AM',
        'includesDatesVenue' => false,
        'includesRegistration' => false,
        'includesGraphics' => false,
        'includesGraphicsDigital' => false,
        'includesGraphicsPrint' => false,
        'includesSignage' => false,
        'termsAccepted' => false,
    ];

    $response = $this
        ->from(route('work-request'))
        ->post(route('work-request.entries.store'), [
            'payload' => $payload,
        ]);

    $response
        ->assertRedirect(route('work-request'))
        ->assertSessionHasErrors([
            'natureOfRequest',
            'termsAccepted',
        ]);

    $this->assertDatabaseMissing('work_request_entries', [
        'email' => 'jane@example.com',
    ]);
});
