<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Console\Command\Command;

test('queue health check passes when backlog and failed counts are within thresholds', function () {
    config()->set('queue.default', 'database');

    $exitCode = Artisan::call('queue:health-check', [
        '--warn-backlog' => 5,
        '--warn-failed' => 0,
    ]);

    expect($exitCode)->toBe(Command::SUCCESS);
});

test('queue health check fails when failed jobs exceed threshold', function () {
    config()->set('queue.default', 'database');

    DB::table('failed_jobs')->insert([
        'uuid' => (string) str()->uuid(),
        'connection' => 'database',
        'queue' => 'default',
        'payload' => '{}',
        'exception' => 'Test failure',
        'failed_at' => now(),
    ]);

    $exitCode = Artisan::call('queue:health-check', [
        '--warn-backlog' => 50,
        '--warn-failed' => 0,
    ]);

    expect($exitCode)->toBe(Command::FAILURE);
});
