<?php

use App\Mail\MailHealthCheckMail;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Console\Command\Command;

test('mail health check command can send a test email', function () {
    Mail::fake();
    config()->set('mail.default', 'smtp');
    config()->set('mail.mailers.smtp.transport', 'smtp');
    config()->set('mail.mailers.smtp.host', 'smtp.example.com');
    config()->set('mail.mailers.smtp.port', 587);
    config()->set('mail.from.address', 'noreply@example.com');
    config()->set('mail.from.name', 'JG Forms');

    $exitCode = Artisan::call('mail:health-check', [
        '--send-to' => 'ops@example.com',
    ]);

    expect($exitCode)->toBe(Command::SUCCESS);

    Mail::assertSent(
        MailHealthCheckMail::class,
        fn (MailHealthCheckMail $mail): bool => $mail->hasTo('ops@example.com'),
    );
});

test('mail health check command fails in production when mail config is incomplete', function () {
    config()->set('app.env', 'production');
    config()->set('mail.default', 'log');
    config()->set('mail.mailers.log.transport', 'log');
    config()->set('mail.from.address', 'noreply@example.com');

    $exitCode = Artisan::call('mail:health-check');

    expect($exitCode)->toBe(Command::FAILURE);
});
