<?php

use App\Mail\WorkFormSubmissionNotificationMail;
use App\Mail\WorkFormTemplateNotificationMail;
use App\Models\User;
use App\Models\WorkForm;
use App\Models\WorkFormEmailTemplate;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can view and manage email templates', function () {
    $admin = User::factory()->create(['email' => 'admin@example.com']);
    config(['workforms.admin_emails' => ['admin@example.com']]);

    $this->actingAs($admin)
        ->get(route('admin.forms.email-templates.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/forms/email-templates-index')
            ->has('forms')
        );

    $workRequestForm = WorkForm::query()
        ->where('slug', 'work-request')
        ->firstOrFail();

    $this->actingAs($admin)
        ->post(route('admin.forms.email-templates.store', $workRequestForm->slug), [
            'triggerEvent' => 'submission_created',
            'name' => 'Team Alert',
            'subject' => 'New request {{entry.id}}',
            'heading' => 'New Request',
            'body' => 'Hello {{entry.first_name}}',
            'toRecipients' => 'alerts@example.com',
            'ccRecipients' => '',
            'bccRecipients' => '',
            'useDefaultRecipients' => false,
            'isActive' => true,
            'position' => 10,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('work_form_email_templates', [
        'work_form_id' => $workRequestForm->id,
        'name' => 'Team Alert',
        'trigger_event' => 'submission_created',
        'is_active' => true,
        'position' => 10,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.forms.email-templates.show', $workRequestForm->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/forms/email-templates')
            ->where('form.slug', 'work-request')
            ->has('templates', 1)
            ->has('placeholders')
        );
});

test('public work request submission uses active email templates when available', function () {
    config()->set('services.recaptcha.enabled', false);
    config()->set('workforms.notification_recipients', [
        ['email' => 'fallback@example.com', 'name' => null],
    ]);
    Mail::fake();

    $form = WorkForm::query()
        ->where('slug', 'work-request')
        ->firstOrFail();

    WorkFormEmailTemplate::query()->create([
        'work_form_id' => $form->id,
        'trigger_event' => 'submission_created',
        'name' => 'Template 1',
        'subject' => 'Hello {{entry.first_name}} - {{payload.eventName}}',
        'heading' => 'Heading {{entry.id}}',
        'body' => 'Body for {{entry.first_name}} {{entry.last_name}} / {{payload.eventName}}',
        'to_recipients' => [
            ['email' => 'template@example.com', 'name' => null],
        ],
        'cc_recipients' => [],
        'bcc_recipients' => [],
        'use_default_recipients' => false,
        'is_active' => true,
        'position' => 0,
    ]);

    $response = $this
        ->from(route('work-request'))
        ->post(route('work-request.entries.store'), [
            'payload' => [
                'firstName' => 'Jane',
                'lastName' => 'Doe',
                'email' => 'jane@example.com',
                'cellphone' => '+27820000000',
                'congregation' => 'City Bowl AM',
                'eventName' => 'Sunday Service',
                'includesDatesVenue' => true,
                'includesRegistration' => false,
                'includesGraphics' => true,
                'includesGraphicsDigital' => true,
                'includesGraphicsPrint' => false,
                'includesSignage' => false,
            ],
        ]);

    $response->assertRedirect(route('work-request'));

    Mail::assertSent(WorkFormTemplateNotificationMail::class, function (WorkFormTemplateNotificationMail $mail): bool {
        return $mail->hasTo('template@example.com')
            && str_contains($mail->subjectLine, 'Hello Jane - Sunday Service')
            && str_contains($mail->body, 'Body for Jane Doe / Sunday Service');
    });
    Mail::assertNotSent(WorkFormSubmissionNotificationMail::class);
});
