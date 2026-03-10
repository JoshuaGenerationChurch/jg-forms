<?php

use App\Http\Controllers\Admin\AdminInvitationController;
use App\Http\Controllers\AcceptInvitationController;
use App\Http\Controllers\WorkRequest\DigitalMediaOptionsController;
use App\Http\Controllers\WorkRequest\WorkFormController;
use App\Http\Controllers\WorkRequest\WorkFormEmailTemplateController;
use App\Http\Controllers\WorkRequest\WorkRequestEntryController;
use App\Http\Controllers\ContactUsController;
use App\Models\WorkForm;
use App\Models\WorkRequestEntry;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$webauthnAuthenticateController = \LaravelWebauthn\Http\Controllers\AuthenticateController::class;
$webauthnKeyController = \LaravelWebauthn\Http\Controllers\WebauthnKeyController::class;
$webauthnAvailable = class_exists($webauthnAuthenticateController) && class_exists($webauthnKeyController);

Route::get('/', function () {
    return redirect()->route('forms.index');
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

    Route::get('easter-holidays/entries/{entry}/edit', [WorkRequestEntryController::class, 'editPublicEasterHolidayEntry'])
        ->middleware('signed')
        ->name('easter-holidays.entries.edit');

    Route::put('easter-holidays/entries/{entry}', [WorkRequestEntryController::class, 'updatePublicEasterHolidayEntry'])
        ->middleware('signed')
        ->name('easter-holidays.entries.update');

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

Route::get('contact-us', [ContactUsController::class, 'create'])
    ->name('contact-us');

Route::post('contact-us', [ContactUsController::class, 'store'])
    ->name('contact-us.store');

Route::get('invite/{token}', AcceptInvitationController::class)
    ->where('token', '[A-Za-z0-9]+')
    ->name('invitations.accept');

if ($webauthnAvailable) {
    // WebAuthn guest routes (for login)
    Route::middleware(['web', 'guest'])->group(function () use ($webauthnAuthenticateController) {
        Route::post('/webauthn/login/options', [$webauthnAuthenticateController, 'create'])
            ->name('webauthn.login.options');
        Route::post('/webauthn/login', [$webauthnAuthenticateController, 'store'])
            ->name('webauthn.login');
    });
}

Route::middleware(['auth', 'verified'])->group(function () use ($webauthnAvailable, $webauthnKeyController) {
    Route::get('dashboard', function () {
        $forms = WorkForm::query()
            ->orderBy('id')
            ->get(['slug', 'title', 'is_active']);

        $entriesBySlug = WorkRequestEntry::query()
            ->selectRaw('form_slug, COUNT(*) as count, MAX(created_at) as latest_entry_at')
            ->groupBy('form_slug')
            ->get()
            ->keyBy('form_slug');

        $recentEntries = WorkRequestEntry::query()
            ->latest()
            ->limit(8)
            ->get(['id', 'form_slug', 'event_name', 'congregation', 'created_at'])
            ->map(static fn (WorkRequestEntry $entry): array => [
                'id' => $entry->id,
                'formSlug' => $entry->form_slug,
                'eventName' => $entry->event_name,
                'congregation' => $entry->congregation,
                'createdAt' => $entry->created_at?->toIso8601String(),
            ])
            ->values();

        return Inertia::render('dashboard', [
            'metrics' => [
                'totalForms' => $forms->count(),
                'activeForms' => $forms->where('is_active', true)->count(),
                'totalEntries' => WorkRequestEntry::query()->count(),
            ],
            'formsSummary' => $forms->map(static function (WorkForm $form) use ($entriesBySlug): array {
                $entryStats = $entriesBySlug->get($form->slug);

                return [
                    'slug' => $form->slug,
                    'title' => $form->title,
                    'isActive' => $form->is_active,
                    'entryCount' => (int) ($entryStats->count ?? 0),
                    'latestEntryAt' => $entryStats?->latest_entry_at !== null
                        ? (string) $entryStats->latest_entry_at
                        : null,
                ];
            })->values(),
            'recentEntries' => $recentEntries,
        ]);
    })->name('dashboard');

    if ($webauthnAvailable) {
        // WebAuthn authenticated routes (for registration and management)
        Route::post('/webauthn/register/options', [$webauthnKeyController, 'create'])
            ->name('webauthn.register.options');
        Route::post('/webauthn/register', [$webauthnKeyController, 'store'])
            ->name('webauthn.register');
        Route::delete('/webauthn/{id}', [$webauthnKeyController, 'destroy'])
            ->name('webauthn.destroy');

        // Passkey settings page
        Route::get('/settings/passkeys', function () {
            return Inertia::render('settings/passkeys', [
                'credentials' => auth()->user()->webauthnKeys()->get(),
            ]);
        })->name('settings.passkeys');
    }
});

Route::middleware(['auth', 'verified', 'workforms.admin'])->group(function () {
    Route::get('admin/invitations', [AdminInvitationController::class, 'index'])
        ->middleware('can:invitations.manage')
        ->name('admin.invitations.index');

    Route::post('admin/invitations', [AdminInvitationController::class, 'store'])
        ->middleware('can:invitations.manage')
        ->name('admin.invitations.store');

    Route::delete('admin/invitations/{invitation}', [AdminInvitationController::class, 'revoke'])
        ->middleware('can:invitations.manage')
        ->name('admin.invitations.revoke');

    Route::get('admin/forms', [WorkFormController::class, 'adminIndex'])
        ->name('admin.forms.index');

    Route::get('admin/forms/entries', [WorkRequestEntryController::class, 'adminFormsEntriesIndex'])
        ->name('admin.forms.entries.index');

    Route::get('admin/forms/email-templates', [WorkFormEmailTemplateController::class, 'index'])
        ->name('admin.forms.email-templates.index');

    Route::get('admin/forms/email-templates/{formSlug}', [WorkFormEmailTemplateController::class, 'show'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.email-templates.show');

    Route::post('admin/forms/email-templates/{formSlug}', [WorkFormEmailTemplateController::class, 'store'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.email-templates.store');

    Route::put('admin/forms/email-templates/{formSlug}/reorder', [WorkFormEmailTemplateController::class, 'reorder'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.email-templates.reorder');

    Route::put('admin/forms/email-templates/{formSlug}/{template}', [WorkFormEmailTemplateController::class, 'update'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.email-templates.update');

    Route::delete('admin/forms/email-templates/{formSlug}/{template}', [WorkFormEmailTemplateController::class, 'destroy'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.email-templates.destroy');

    Route::get('admin/forms/entries/{formSlug}', [WorkRequestEntryController::class, 'adminFormEntries'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.entries.show');

    Route::get('admin/forms/entries/{formSlug}/export', [WorkRequestEntryController::class, 'adminFormEntriesExport'])
        ->where('formSlug', '[A-Za-z0-9\-]+')
        ->name('admin.forms.entries.export');

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
