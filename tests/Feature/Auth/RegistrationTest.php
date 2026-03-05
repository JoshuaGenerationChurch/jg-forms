<?php

use App\Models\AdminInvitation;
use App\Models\User;
use App\Services\AdminInvitationService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('registration screen can be rendered when open registration is enabled', function () {
    config(['workforms.invite_only_registration' => false]);

    $response = $this->get(route('register'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('auth/register'));
});

test('registration screen requires invite when invite-only is enabled', function () {
    config(['workforms.invite_only_registration' => true]);

    $response = $this->get(route('register'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('auth/register-invite-required'));
});

test('new users can register when invite-only is disabled', function () {
    config(['workforms.invite_only_registration' => false]);
    $this->seed(RolesAndPermissionsSeeder::class);

    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::query()->where('email', 'test@example.com')->firstOrFail();
    expect($user->hasRole('requester'))->toBeTrue();
});

test('invited users can register and receive invited role', function () {
    config(['workforms.invite_only_registration' => true]);
    $this->seed(RolesAndPermissionsSeeder::class);

    /** @var AdminInvitationService $invitationService */
    $invitationService = app(AdminInvitationService::class);
    $result = $invitationService->issueInvitation(
        email: 'invited@example.com',
        roleName: 'forms-admin',
        invitedBy: null,
        expiresInDays: 7,
    );

    $response = $this->post(route('register.store'), [
        'name' => 'Invited User',
        'email' => 'invited@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'invite_token' => $result['token'],
    ]);

    $response->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticated();

    $user = User::query()->where('email', 'invited@example.com')->firstOrFail();
    expect($user->hasRole('forms-admin'))->toBeTrue();

    $invitation = AdminInvitation::query()->where('email', 'invited@example.com')->firstOrFail();
    expect($invitation->accepted_at)->not->toBeNull();
    expect($invitation->accepted_by_user_id)->toBe($user->id);
});

test('invite-only registration rejects missing invite token', function () {
    config(['workforms.invite_only_registration' => true]);
    $this->seed(RolesAndPermissionsSeeder::class);

    $response = $this->post(route('register.store'), [
        'name' => 'No Invite User',
        'email' => 'noinvite@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors(['invite_token']);
    $this->assertGuest();
});
