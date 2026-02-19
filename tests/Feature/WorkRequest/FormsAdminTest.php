<?php

use App\Models\User;
use App\Models\WorkRequestEntry;
use Inertia\Testing\AssertableInertia as Assert;

test('public forms directory is accessible', function () {
    $response = $this->get(route('forms.index'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('forms/index')
            ->has('forms', 3)
            ->where('forms.0.slug', 'work-request')
            ->where('forms.1.slug', 'easter-holidays')
            ->where('forms.2.slug', 'christmas-holidays')
        );
});

test('non-admin users cannot access forms admin pages', function () {
    $user = User::factory()->create();
    config(['workforms.admin_emails' => ['admin@example.com']]);

    $this->actingAs($user)
        ->get(route('admin.forms.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('admin.forms.entries.index'))
        ->assertForbidden();
});

test('admin users can view forms and entries in forms admin', function () {
    $admin = User::factory()->create(['email' => 'admin@example.com']);
    $submitter = User::factory()->create();

    config(['workforms.admin_emails' => ['admin@example.com']]);

    $entry = WorkRequestEntry::query()->create([
        'user_id' => $submitter->id,
        'form_slug' => 'work-request',
        'first_name' => 'Submitter',
        'last_name' => 'User',
        'email' => 'submitter@example.com',
        'payload' => [
            'eventName' => 'Admin Test Event',
            'isUserOrganiser' => 'No',
            'organiserFirstName' => 'Event',
            'organiserLastName' => 'Owner',
        ],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.forms.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/forms/index')
            ->has('forms', 3)
            ->where('forms.0.slug', 'work-request')
            ->where('forms.0.entryCount', 1)
            ->where('forms.1.slug', 'easter-holidays')
            ->where('forms.2.slug', 'christmas-holidays')
        );

    $this->actingAs($admin)
        ->get(route('admin.forms.entries.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/forms/entries-index')
            ->has('forms', 3)
            ->where('forms.0.slug', 'work-request')
            ->where('forms.0.entryCount', 1)
        );

    $this->actingAs($admin)
        ->get(route('admin.forms.entries.show', 'work-request'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/forms/entries')
            ->where('form.slug', 'work-request')
            ->has('entries', 1)
            ->where('entries.0.id', $entry->id)
        );

    $this->actingAs($admin)
        ->get(route('admin.forms.entries.entry.show', [
            'formSlug' => 'work-request',
            'entry' => $entry->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/forms/entry-show')
            ->where('entry.id', $entry->id)
            ->where('entry.payload.isUserOrganiser', 'No')
        );
});

test('admin users can edit and delete form entries', function () {
    $admin = User::factory()->create(['email' => 'admin@example.com']);
    config(['workforms.admin_emails' => ['admin@example.com']]);

    $entry = WorkRequestEntry::query()->create([
        'user_id' => null,
        'form_slug' => 'work-request',
        'first_name' => 'Before',
        'last_name' => 'Entry',
        'email' => 'before@example.com',
        'event_name' => 'Before Event',
        'payload' => ['eventName' => 'Before Event'],
    ]);

    $this->actingAs($admin)
        ->put(route('admin.forms.entries.entry.update', [
            'formSlug' => 'work-request',
            'entry' => $entry->id,
        ]), [
            'firstName' => 'After',
            'lastName' => 'Entry',
            'email' => 'after@example.com',
            'cellphone' => '',
            'congregation' => '',
            'eventName' => 'After Event',
            'payloadJson' => json_encode(['eventName' => 'After Event']),
        ])
        ->assertRedirect(route('admin.forms.entries.entry.show', [
            'formSlug' => 'work-request',
            'entry' => $entry->id,
        ]));

    $this->assertDatabaseHas('work_request_entries', [
        'id' => $entry->id,
        'first_name' => 'After',
        'email' => 'after@example.com',
        'event_name' => 'After Event',
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.forms.entries.entry.destroy', [
            'formSlug' => 'work-request',
            'entry' => $entry->id,
        ]))
        ->assertRedirect(route('admin.forms.entries.show', 'work-request'));

    $this->assertDatabaseMissing('work_request_entries', [
        'id' => $entry->id,
    ]);
});
