<?php

use App\Http\Controllers\WorkRequest\DigitalMediaOptionsController;
use App\Http\Controllers\WorkRequest\WorkFormController;
use App\Http\Controllers\WorkRequest\WorkRequestEntryController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::prefix('forms')->name('forms.')->group(function () {
    Route::get('/', [WorkFormController::class, 'publicIndex'])->name('index');

    Route::get('easter-holidays', function () {
        return Inertia::render('forms/easter-holidays');
    })->name('easter-holidays');

    Route::get('christmas-holidays', function () {
        return Inertia::render('forms/christmas-holidays');
    })->name('christmas-holidays');

    Route::post('easter-holidays/entries', [WorkRequestEntryController::class, 'storePublicEasterHolidayEntry'])
        ->name('easter-holidays.entries.store');

    Route::post('christmas-holidays/entries', [WorkRequestEntryController::class, 'storePublicChristmasHolidayEntry'])
        ->name('christmas-holidays.entries.store');
});

Route::get('work-request', function () {
    return Inertia::render('work-request-tabs');
})->name('work-request');

Route::post('work-request/entries', [WorkRequestEntryController::class, 'storePublicWorkRequestEntry'])
    ->name('work-request.entries.store');

Route::get('work-request/digital-media-options', DigitalMediaOptionsController::class)
    ->name('work-request.digital-media-options');

// WebAuthn guest routes (for login)
Route::middleware(['web', 'guest'])->group(function () {
    Route::post('/webauthn/login/options', [WebauthnController::class, 'loginOptions'])
        ->name('webauthn.login.options');
    Route::post('/webauthn/login', [WebauthnController::class, 'login'])
        ->name('webauthn.login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('work-request/entries', [WorkRequestEntryController::class, 'index'])
        ->name('work-request.entries.index');

    Route::get('work-request/entries/{entry}', [WorkRequestEntryController::class, 'show'])
        ->name('work-request.entries.show');

    // WebAuthn authenticated routes (for registration and management)
    Route::post('/webauthn/register/options', [WebauthnController::class, 'registerOptions'])
        ->name('webauthn.register.options');
    Route::post('/webauthn/register', [WebauthnController::class, 'register'])
        ->name('webauthn.register');
    Route::get('/webauthn/keys', [WebauthnController::class, 'index'])
        ->name('webauthn.index');
    Route::delete('/webauthn/{id}', [WebauthnController::class, 'destroy'])
        ->name('webauthn.destroy');

    // Passkey settings page
    Route::get('/settings/passkeys', function () {
        return Inertia::render('settings/passkeys', [
            'credentials' => auth()->user()->webauthnKeys()->get()
        ]);
    })->name('settings.passkeys');
});

Route::middleware(['auth', 'verified', 'workforms.admin'])->group(function () {
    Route::get('admin/forms', [WorkFormController::class, 'adminIndex'])
        ->name('admin.forms.index');

    Route::get('admin/forms/entries', [WorkRequestEntryController::class, 'adminFormsEntriesIndex'])
        ->name('admin.forms.entries.index');

    Route::get('admin/forms/entries/{formSlug}', [WorkRequestEntryController::class, 'adminFormEntries'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.entries.show');

    Route::get('admin/forms/entries/{formSlug}/{entry}', [WorkRequestEntryController::class, 'adminFormEntryShow'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.entries.entry.show');

    Route::get('admin/forms/entries/{formSlug}/{entry}/edit', [WorkRequestEntryController::class, 'adminFormEntryEdit'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.entries.entry.edit');

    Route::put('admin/forms/entries/{formSlug}/{entry}', [WorkRequestEntryController::class, 'adminFormEntryUpdate'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.entries.entry.update');

    Route::delete('admin/forms/entries/{formSlug}/{entry}', [WorkRequestEntryController::class, 'adminFormEntryDestroy'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.entries.entry.destroy');

    Route::get('admin/forms/{formSlug}', [WorkFormController::class, 'adminShow'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.show');

    Route::get('admin/forms/{formSlug}/edit', [WorkFormController::class, 'adminEdit'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.edit');

    Route::put('admin/forms/{formSlug}', [WorkFormController::class, 'adminUpdate'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.update');

    Route::delete('admin/forms/{formSlug}', [WorkFormController::class, 'adminDestroy'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.destroy');
});

require __DIR__.'/settings.php';
