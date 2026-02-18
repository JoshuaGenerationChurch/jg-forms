<?php

use App\Services\RecaptchaEnterpriseService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
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
