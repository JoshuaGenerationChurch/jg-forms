<?php

use App\Models\WorkRequestEntry;
use Inertia\Testing\AssertableInertia as Assert;

test('work request form is publicly accessible', function () {
    $this->get(route('work-request'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('work-request-tabs'));
});

test('guest can submit a public work request entry', function () {
    $payload = [
        'firstName' => 'Jane',
        'lastName' => 'Doe',
        'email' => 'jane@example.com',
        'cellphone' => '+27820000000',
        'congregation' => 'City Bowl AM',
        'requestSummary' => 'Sunday event assets',
        'eventName' => 'Sunday Service',
        'includesDatesVenue' => true,
        'includesRegistration' => true,
        'includesGraphics' => true,
        'includesGraphicsDigital' => true,
        'includesGraphicsPrint' => false,
        'includesSignage' => true,
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
});
