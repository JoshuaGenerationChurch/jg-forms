<?php

use App\Models\User;
use App\Models\WorkRequestEntry;
use Inertia\Testing\AssertableInertia as Assert;

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
    config(['workforms.admin_emails' => ['admin@example.com']]);

    $payload = [
        'congregation' => 'City Bowl AM',
        'firstName' => 'Sam',
        'lastName' => 'Leader',
        'email' => 'sam@example.com',
        'cellphone' => '+27820000000',
        'notes' => 'Please publish across all campuses.',
        'serviceTimes' => [
            [
                'serviceName' => 'Good Friday Service',
                'date' => '2026-04-03',
                'startTime' => '09:00',
                'venue' => 'Main Hall',
            ],
            [
                'serviceName' => 'Resurrection Sunday',
                'date' => '2026-04-05',
                'startTime' => '09:00',
                'venue' => 'Main Hall',
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

    $this->actingAs($admin)
        ->get(route('admin.forms.entries.show', 'easter-holidays'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/forms/entries')
            ->where('form.slug', 'easter-holidays')
            ->has('entries', 1)
        );
});
