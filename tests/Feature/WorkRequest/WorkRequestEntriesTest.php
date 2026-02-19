<?php

use App\Models\User;
use App\Models\WorkRequestEntry;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['workforms.admin_emails' => ['admin@example.com']]);
});

test('guests are redirected when accessing work request entries', function () {
    $response = $this->get(route('work-request.entries.index'));

    $response->assertRedirect(route('login'));
});

test('users can view their own entries index and show pages', function () {
    $user = User::factory()->create();
    $entry = WorkRequestEntry::query()->create([
        'user_id' => $user->id,
        'first_name' => 'John',
        'last_name' => 'Smith',
        'email' => 'john@example.com',
        'payload' => [
            'eventName' => 'Test Event',
            'isUserOrganiser' => 'Yes',
            'organiserFirstName' => 'John',
            'organiserLastName' => 'Smith',
        ],
    ]);

    $this->actingAs($user)
        ->get(route('work-request.entries.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('work-request-entries/index')
            ->has('entries', 1)
            ->where('entries.0.id', $entry->id)
        );

    $this->actingAs($user)
        ->get(route('work-request.entries.show', $entry))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('work-request-entries/show')
            ->where('entry.id', $entry->id)
            ->where('entry.payload.isUserOrganiser', 'Yes')
        );
});

test('users cannot view other users work request entries', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();

    $entry = WorkRequestEntry::query()->create([
        'user_id' => $owner->id,
        'first_name' => 'Owner',
        'payload' => ['eventName' => 'Private entry'],
    ]);

    $this->actingAs($intruder)
        ->get(route('work-request.entries.show', $entry))
        ->assertNotFound();
});
