<?php

use App\Mail\ContactSubmissionNotificationMail;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

test('contact us page is publicly accessible', function () {
    $this->get(route('contact-us'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('contact-us'));
});

test('guest can submit contact us message and notifications are queued', function () {
    Mail::fake();
    config()->set('workforms.notification_recipients', [
        ['email' => 'support@example.com', 'name' => 'Support Team'],
    ]);

    $this->post(route('contact-us.store'), [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'subject' => 'Need help with a form',
        'message' => 'I cannot submit the print media step.',
    ])->assertSessionHas('success');

    $this->assertDatabaseHas('contact_submissions', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'subject' => 'Need help with a form',
    ]);

    Mail::assertQueued(
        ContactSubmissionNotificationMail::class,
        fn (ContactSubmissionNotificationMail $mail): bool => $mail->hasTo('support@example.com')
            && $mail->submission->email === 'jane@example.com',
    );
});
