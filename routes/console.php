<?php

use App\Mail\MailHealthCheckMail;
use App\Models\User;
use App\Services\RecaptchaEnterpriseService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Symfony\Component\Console\Command\Command;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('recaptcha:health-check', function (RecaptchaEnterpriseService $recaptcha) {
    $result = $recaptcha->healthCheck();

    $this->line('reCAPTCHA Enterprise health check');
    $this->line(sprintf('Enabled: %s', $result['enabled'] ? 'yes' : 'no'));
    $this->line(sprintf('Site key configured: %s', $result['site_key_present'] ? 'yes' : 'no'));
    $this->line(sprintf('Project ID configured: %s', $result['project_id_present'] ? 'yes' : 'no'));
    $this->line(sprintf('Expected action configured: %s', $result['expected_action_present'] ? 'yes' : 'no'));
    $this->line(sprintf('Credentials path: %s', $result['credentials_path'] !== '' ? $result['credentials_path'] : '(empty)'));
    $this->line(sprintf('Credentials file exists: %s', $result['credentials_file_exists'] ? 'yes' : 'no'));
    $this->line(sprintf('Credentials file readable: %s', $result['credentials_file_readable'] ? 'yes' : 'no'));
    $this->line(sprintf('Google access token available: %s', $result['access_token_available'] ? 'yes' : 'no'));
    $this->newLine();

    if (! $result['ok']) {
        $this->error($result['message']);

        return Command::FAILURE;
    }

    $this->info($result['message']);

    return Command::SUCCESS;
})->purpose('Verify reCAPTCHA Enterprise runtime configuration and token connectivity');

Artisan::command('mail:health-check {--send-to= : Recipient email for a test message} {--queue : Queue test email instead of sending immediately}', function () {
    $defaultMailer = (string) config('mail.default', '');
    $mailers = config('mail.mailers', []);
    $activeMailerConfig = is_array($mailers) && is_array($mailers[$defaultMailer] ?? null)
        ? $mailers[$defaultMailer]
        : [];
    $transport = (string) ($activeMailerConfig['transport'] ?? '');

    $fromAddress = trim((string) config('mail.from.address', ''));
    $fromName = trim((string) config('mail.from.name', ''));
    $appEnv = (string) config('app.env', 'local');
    $appUrl = (string) config('app.url', '');

    $this->line('Mail health check');
    $this->line(sprintf('Environment: %s', $appEnv));
    $this->line(sprintf('Default mailer: %s', $defaultMailer !== '' ? $defaultMailer : '(not set)'));
    $this->line(sprintf('Transport: %s', $transport !== '' ? $transport : '(not set)'));
    $this->line(sprintf('From address: %s', $fromAddress !== '' ? $fromAddress : '(not set)'));
    $this->line(sprintf('From name: %s', $fromName !== '' ? $fromName : '(not set)'));

    if ($transport === 'smtp') {
        $this->line(sprintf('SMTP host: %s', (string) ($activeMailerConfig['host'] ?? '(not set)')));
        $this->line(sprintf('SMTP port: %s', (string) ($activeMailerConfig['port'] ?? '(not set)')));
        $this->line(sprintf('SMTP username set: %s', ((string) ($activeMailerConfig['username'] ?? '')) !== '' ? 'yes' : 'no'));
        $this->line(sprintf('SMTP password set: %s', ((string) ($activeMailerConfig['password'] ?? '')) !== '' ? 'yes' : 'no'));
    }

    $issues = [];

    if ($defaultMailer === '' || $transport === '') {
        $issues[] = 'Mail transport is not configured.';
    }

    if (! in_array($transport, ['smtp', 'ses', 'ses-v2', 'postmark', 'resend', 'sendmail', 'failover', 'roundrobin'], true)) {
        $issues[] = 'Mailer is not configured for external delivery.';
    }

    if ($fromAddress === '' || filter_var($fromAddress, FILTER_VALIDATE_EMAIL) === false) {
        $issues[] = 'MAIL_FROM_ADDRESS is missing or invalid.';
    }

    if ($transport === 'smtp') {
        $smtpHost = trim((string) ($activeMailerConfig['host'] ?? ''));
        $smtpPort = (int) ($activeMailerConfig['port'] ?? 0);

        if ($smtpHost === '' || $smtpHost === '127.0.0.1') {
            $issues[] = 'MAIL_HOST is missing or still set to localhost.';
        }

        if ($smtpPort <= 0) {
            $issues[] = 'MAIL_PORT is missing or invalid.';
        }
    }

    if ($issues !== []) {
        $this->newLine();
        foreach ($issues as $issue) {
            $this->warn(sprintf('- %s', $issue));
        }
    }

    $sendTo = trim((string) $this->option('send-to'));
    if ($sendTo !== '') {
        if (filter_var($sendTo, FILTER_VALIDATE_EMAIL) === false) {
            $this->error('The --send-to value is not a valid email address.');

            return Command::FAILURE;
        }

        try {
            $mail = new MailHealthCheckMail(
                appName: (string) config('app.name', 'JG Forms'),
                appUrl: $appUrl,
                mailerName: $defaultMailer,
                transport: $transport,
                sentAt: now()->toDateTimeString(),
            );

            if ((bool) $this->option('queue')) {
                Mail::to($sendTo)->queue($mail);
                $this->info(sprintf('Queued mail health-check email to %s.', $sendTo));
            } else {
                Mail::to($sendTo)->send($mail);
                $this->info(sprintf('Sent mail health-check email to %s.', $sendTo));
            }
        } catch (\Throwable $exception) {
            $this->newLine();
            $this->error(sprintf('Failed to send test email: %s', $exception->getMessage()));

            return Command::FAILURE;
        }
    } else {
        $this->newLine();
        $this->comment('Pass --send-to=you@example.com to send a live test email.');
    }

    if ($appEnv === 'production' && $issues !== []) {
        $this->newLine();
        $this->error('Production mail configuration is incomplete.');

        return Command::FAILURE;
    }

    $this->newLine();
    $this->info('Mail health check completed.');

    return Command::SUCCESS;
})->purpose('Inspect mail configuration and optionally send a live test email');

Artisan::command('queue:health-check {--queue= : Queue name filter (database driver only)} {--warn-backlog=50 : Warn/fail threshold for pending jobs} {--warn-failed=1 : Warn/fail threshold for failed jobs}', function () {
    $connection = (string) config('queue.default', 'sync');
    $warnBacklog = max(0, (int) $this->option('warn-backlog'));
    $warnFailed = max(0, (int) $this->option('warn-failed'));
    $queueName = trim((string) $this->option('queue'));

    $this->line('Queue health check');
    $this->line(sprintf('Queue connection: %s', $connection));

    if ($connection !== 'database') {
        $this->comment('Backlog/failed counts are currently implemented for database queues.');
        $this->comment('Use your queue provider monitoring for this connection.');

        return Command::SUCCESS;
    }

    if (! Schema::hasTable('jobs') || ! Schema::hasTable('failed_jobs')) {
        $this->error('Missing queue tables. Run: php artisan migrate');

        return Command::FAILURE;
    }

    $jobsQuery = DB::table('jobs');
    if ($queueName !== '') {
        $jobsQuery->where('queue', $queueName);
    }

    $pendingJobs = (int) $jobsQuery->count();
    $failedJobs = (int) DB::table('failed_jobs')->count();
    $latestFailedAt = DB::table('failed_jobs')
        ->latest('failed_at')
        ->value('failed_at');

    $this->line(sprintf('Pending jobs%s: %d', $queueName !== '' ? " ({$queueName})" : '', $pendingJobs));
    $this->line(sprintf('Failed jobs: %d', $failedJobs));
    $this->line(sprintf('Latest failed at: %s', $latestFailedAt ?? 'none'));

    $hasBacklogIssue = $pendingJobs > $warnBacklog;
    $hasFailedIssue = $failedJobs > $warnFailed;

    if ($hasBacklogIssue) {
        $this->warn(sprintf('Pending jobs exceed threshold (%d).', $warnBacklog));
    }

    if ($hasFailedIssue) {
        $this->warn(sprintf('Failed jobs exceed threshold (%d).', $warnFailed));
    }

    if ($hasBacklogIssue || $hasFailedIssue) {
        $this->error('Queue health check failed.');

        return Command::FAILURE;
    }

    $this->info('Queue health check passed.');

    return Command::SUCCESS;
})->purpose('Check queue backlog and failed jobs thresholds for database queues');

Artisan::command('workforms:grant-role {email : User email} {role=forms-admin : Role name}', function () {
    $email = strtolower(trim((string) $this->argument('email')));
    $roleName = trim((string) $this->argument('role'));

    if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $this->error('Invalid email address.');

        return Command::FAILURE;
    }

    if ($roleName === '') {
        $this->error('Role name is required.');

        return Command::FAILURE;
    }

    $user = User::query()->where('email', $email)->first();
    if (! $user) {
        $this->error("No user found with email {$email}.");

        return Command::FAILURE;
    }

    Permission::findOrCreate('forms.admin.access', 'web');
    Permission::findOrCreate('invitations.manage', 'web');

    $role = Role::findOrCreate($roleName, 'web');

    if ($roleName === 'forms-admin' || $roleName === 'super-admin') {
        $role->syncPermissions(['forms.admin.access', 'invitations.manage']);
    }

    $user->assignRole($role);

    $this->info("Granted role [{$roleName}] to {$email}.");

    return Command::SUCCESS;
})->purpose('Grant a Spatie role to a user for JG Forms access');
