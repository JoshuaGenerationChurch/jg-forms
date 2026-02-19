<?php

namespace App\Http\Controllers\WorkRequest;

use App\Http\Controllers\Controller;
use App\Models\WorkForm;
use App\Models\WorkRequestEntry;
use App\Services\RecaptchaEnterpriseService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class WorkRequestEntryController extends Controller
{
    public function index(Request $request): Response
    {
        $entries = WorkRequestEntry::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(function (WorkRequestEntry $entry): array {
                return [
                    'id' => $entry->id,
                    'formSlug' => $entry->form_slug,
                    'createdAt' => $entry->created_at?->toIso8601String(),
                    'firstName' => $entry->first_name,
                    'lastName' => $entry->last_name,
                    'email' => $entry->email,
                    'eventName' => $entry->event_name,
                    'requestTypes' => $this->requestTypes($entry),
                ];
            })
            ->values();

        return Inertia::render('work-request-entries/index', [
            'entries' => $entries,
        ]);
    }

    public function show(Request $request, WorkRequestEntry $entry): Response
    {
        abort_unless(
            $entry->user_id === $request->user()->id || $this->isAdmin($request),
            404
        );

        return Inertia::render('work-request-entries/show', [
            'entry' => [
                'id' => $entry->id,
                'formSlug' => $entry->form_slug,
                'createdAt' => $entry->created_at?->toIso8601String(),
                'updatedAt' => $entry->updated_at?->toIso8601String(),
                'firstName' => $entry->first_name,
                'lastName' => $entry->last_name,
                'email' => $entry->email,
                'cellphone' => $entry->cellphone,
                'congregation' => $entry->congregation,
                'eventName' => $entry->event_name,
                'requestTypes' => $this->requestTypes($entry),
                'payload' => $entry->payload,
            ],
        ]);
    }

    public function storePublicWorkRequestEntry(
        Request $request,
        RecaptchaEnterpriseService $recaptcha,
    ): RedirectResponse {
        $rules = [
            'payload' => ['required', 'array'],
        ];

        if ($recaptcha->enabled()) {
            $rules['recaptchaToken'] = ['required', 'string'];
        }

        $validated = $request->validate($rules);

        if ($recaptcha->enabled()) {
            $verification = $recaptcha->verifyToken((string) ($validated['recaptchaToken'] ?? ''));
            if (! $verification['success']) {
                return back()->withErrors([
                    'recaptcha' => $verification['message'] ?? 'Could not verify spam protection. Please try again.',
                ])->withInput();
            }
        }

        /** @var array<string, mixed> $payload */
        $payload = $validated['payload'];

        WorkRequestEntry::query()->create([
            'user_id' => null,
            'form_slug' => 'work-request',
            'first_name' => Arr::get($payload, 'firstName'),
            'last_name' => Arr::get($payload, 'lastName'),
            'email' => Arr::get($payload, 'email'),
            'cellphone' => Arr::get($payload, 'cellphone'),
            'congregation' => Arr::get($payload, 'congregation'),
            'event_name' => Arr::get($payload, 'eventName'),
            'includes_dates_venue' => (bool) Arr::get($payload, 'includesDatesVenue', false),
            'includes_registration' => (bool) Arr::get($payload, 'includesRegistration', false),
            'includes_graphics' => (bool) Arr::get($payload, 'includesGraphics', false),
            'includes_graphics_digital' => (bool) Arr::get($payload, 'includesGraphicsDigital', false),
            'includes_graphics_print' => (bool) Arr::get($payload, 'includesGraphicsPrint', false),
            'includes_signage' => (bool) Arr::get($payload, 'includesSignage', false),
            'payload' => $payload,
        ]);

        return back();
    }

    public function storePublicEasterHolidayEntry(
        Request $request,
        RecaptchaEnterpriseService $recaptcha,
    ): RedirectResponse {
        return $this->storePublicHolidayEntryBySlug($request, 'easter-holidays', $recaptcha);
    }

    public function storePublicChristmasHolidayEntry(
        Request $request,
        RecaptchaEnterpriseService $recaptcha,
    ): RedirectResponse {
        return $this->storePublicHolidayEntryBySlug($request, 'christmas-holidays', $recaptcha);
    }

    private function storePublicHolidayEntryBySlug(
        Request $request,
        string $formSlug,
        RecaptchaEnterpriseService $recaptcha,
    ): RedirectResponse {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);

        $rules = [
            'congregation' => ['required', 'string', 'max:255'],
            'firstName' => ['required', 'string', 'max:255'],
            'lastName' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'cellphone' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'serviceTimes' => ['required', 'array', 'min:1'],
            'serviceTimes.*.serviceName' => ['nullable', 'string', 'max:255'],
            'serviceTimes.*.date' => ['required', 'date', 'after_or_equal:today'],
            'serviceTimes.*.startTime' => ['required', 'string', 'max:255'],
            'serviceTimes.*.venue' => ['nullable', 'string', 'max:255'],
        ];

        if ($recaptcha->enabled()) {
            $rules['recaptchaToken'] = ['required', 'string'];
        }

        $validated = $request->validate($rules);

        if ($recaptcha->enabled()) {
            $verification = $recaptcha->verifyToken((string) ($validated['recaptchaToken'] ?? ''));
            if (! $verification['success']) {
                return back()->withErrors([
                    'recaptcha' => $verification['message'] ?? 'Could not verify spam protection. Please try again.',
                ])->withInput();
            }
        }

        $serviceTimes = collect($validated['serviceTimes'])
            ->map(function (array $service): array {
                return [
                    'serviceName' => trim((string) ($service['serviceName'] ?? '')),
                    'date' => (string) ($service['date'] ?? ''),
                    'startTime' => trim((string) ($service['startTime'] ?? '')),
                    'venue' => trim((string) ($service['venue'] ?? '')),
                ];
            })
            ->values()
            ->all();

        $payload = [
            'congregation' => trim((string) $validated['congregation']),
            'firstName' => trim((string) $validated['firstName']),
            'lastName' => trim((string) $validated['lastName']),
            'email' => trim((string) $validated['email']),
            'cellphone' => trim((string) ($validated['cellphone'] ?? '')),
            'notes' => trim((string) ($validated['notes'] ?? '')),
            'serviceTimes' => $serviceTimes,
        ];

        WorkRequestEntry::query()->create([
            'user_id' => null,
            'form_slug' => $formSlug,
            'first_name' => $payload['firstName'],
            'last_name' => $payload['lastName'],
            'email' => $payload['email'],
            'cellphone' => $payload['cellphone'] !== '' ? $payload['cellphone'] : null,
            'congregation' => $payload['congregation'],
            'event_name' => sprintf('%s - %s', (string) $payload['congregation'], (string) ($form['title'] ?? 'Service Times')),
            'payload' => $payload,
        ]);

        return back();
    }

    public function adminFormsEntriesIndex(): Response
    {
        $forms = collect($this->formsConfig())
            ->map(function (array $form): array {
                $slug = (string) ($form['slug'] ?? '');

                $entriesQuery = WorkRequestEntry::query()->where('form_slug', $slug);

                return [
                    'slug' => $slug,
                    'title' => (string) ($form['title'] ?? $slug),
                    'description' => (string) ($form['description'] ?? ''),
                    'entryCount' => (int) $entriesQuery->count(),
                    'latestEntryAt' => $entriesQuery->max('created_at'),
                ];
            })
            ->values();

        return Inertia::render('admin/forms/entries-index', [
            'forms' => $forms,
        ]);
    }

    public function adminFormEntries(string $formSlug): Response
    {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);

        $entries = WorkRequestEntry::query()
            ->where('form_slug', $formSlug)
            ->latest()
            ->get()
            ->map(fn (WorkRequestEntry $entry): array => $this->entrySummary($entry))
            ->values();

        return Inertia::render('admin/forms/entries', [
            'form' => $form,
            'entries' => $entries,
        ]);
    }

    public function adminFormEntryShow(string $formSlug, WorkRequestEntry $entry): Response
    {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);
        $this->assertEntryBelongsToForm($entry, $formSlug);

        return Inertia::render('admin/forms/entry-show', [
            'form' => $form,
            'entry' => $this->entryDetail($entry),
        ]);
    }

    public function adminFormEntryEdit(string $formSlug, WorkRequestEntry $entry): Response
    {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);
        $this->assertEntryBelongsToForm($entry, $formSlug);

        return Inertia::render('admin/forms/entry-edit', [
            'form' => $form,
            'entry' => $this->entryDetail($entry),
        ]);
    }

    public function adminFormEntryUpdate(Request $request, string $formSlug, WorkRequestEntry $entry): RedirectResponse
    {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);
        $this->assertEntryBelongsToForm($entry, $formSlug);

        $validated = $request->validate([
            'firstName' => ['nullable', 'string', 'max:255'],
            'lastName' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'cellphone' => ['nullable', 'string', 'max:255'],
            'congregation' => ['nullable', 'string', 'max:255'],
            'eventName' => ['nullable', 'string', 'max:255'],
            'payloadJson' => ['required', 'string', 'json'],
        ]);

        /** @var mixed $decodedPayload */
        $decodedPayload = json_decode((string) $validated['payloadJson'], true);
        if (! is_array($decodedPayload)) {
            return back()->withErrors([
                'payloadJson' => 'Payload must decode to a JSON object.',
            ]);
        }

        /** @var array<string, mixed> $payload */
        $payload = $decodedPayload;

        $entry->update([
            'first_name' => Arr::get($validated, 'firstName'),
            'last_name' => Arr::get($validated, 'lastName'),
            'email' => Arr::get($validated, 'email'),
            'cellphone' => Arr::get($validated, 'cellphone'),
            'congregation' => Arr::get($validated, 'congregation'),
            'event_name' => Arr::get($validated, 'eventName'),
            'includes_dates_venue' => (bool) Arr::get($payload, 'includesDatesVenue', $entry->includes_dates_venue),
            'includes_registration' => (bool) Arr::get($payload, 'includesRegistration', $entry->includes_registration),
            'includes_graphics' => (bool) Arr::get($payload, 'includesGraphics', $entry->includes_graphics),
            'includes_graphics_digital' => (bool) Arr::get($payload, 'includesGraphicsDigital', $entry->includes_graphics_digital),
            'includes_graphics_print' => (bool) Arr::get($payload, 'includesGraphicsPrint', $entry->includes_graphics_print),
            'includes_signage' => (bool) Arr::get($payload, 'includesSignage', $entry->includes_signage),
            'payload' => $payload,
        ]);

        return redirect()->route('admin.forms.entries.entry.show', [
            'formSlug' => $formSlug,
            'entry' => $entry->id,
        ]);
    }

    public function adminFormEntryDestroy(string $formSlug, WorkRequestEntry $entry): RedirectResponse
    {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);
        $this->assertEntryBelongsToForm($entry, $formSlug);

        $entry->delete();

        return redirect()->route('admin.forms.entries.show', [
            'formSlug' => $formSlug,
        ]);
    }

    /**
     * @return array<int, string>
     */
    private function requestTypes(WorkRequestEntry $entry): array
    {
        $types = [];

        if ($entry->includes_dates_venue) {
            $types[] = 'Event logistics';
        }

        if ($entry->includes_registration) {
            $types[] = 'Registration form';
        }

        if ($entry->includes_graphics_digital) {
            $types[] = 'Digital media';
        }

        if ($entry->includes_graphics_print) {
            $types[] = 'Print media';
        }

        if ($entry->includes_signage) {
            $types[] = 'Signage';
        }

        if (count($types) === 0) {
            if ($entry->form_slug === 'easter-holidays') {
                $types[] = 'Easter service times';
            }

            if ($entry->form_slug === 'christmas-holidays') {
                $types[] = 'Christmas service times';
            }
        }

        return $types;
    }

    /**
     * @return array<int, array{slug: string, title: string, description: string, url: string}>
     */
    private function formsConfig(): array
    {
        $forms = WorkForm::query()
            ->orderBy('id')
            ->get()
            ->map(function (WorkForm $form): array {
                return [
                    'slug' => $form->slug,
                    'title' => $form->title,
                    'description' => $form->description ?? '',
                    'url' => $form->url,
                ];
            })
            ->all();

        if (count($forms) > 0) {
            return $forms;
        }

        $forms = config('workforms.forms', []);

        return is_array($forms) ? $forms : [];
    }

    /**
     * @return array{slug: string, title: string, description: string, url: string}|null
     */
    private function findForm(string $slug): ?array
    {
        return collect($this->formsConfig())
            ->first(fn (array $form): bool => ($form['slug'] ?? null) === $slug);
    }

    private function isAdmin(Request $request): bool
    {
        $user = $request->user();
        if (! $user) {
            return false;
        }

        $adminEmails = config('workforms.admin_emails', []);
        if (! is_array($adminEmails)) {
            return false;
        }

        if (count($adminEmails) === 0) {
            return true;
        }

        return in_array(strtolower((string) $user->email), $adminEmails, true);
    }

    private function assertEntryBelongsToForm(WorkRequestEntry $entry, string $formSlug): void
    {
        abort_unless($entry->form_slug === $formSlug, 404);
    }

    /**
     * @return array{id:int,formSlug:string,createdAt:string|null,firstName:string|null,lastName:string|null,email:string|null,eventName:string|null,requestTypes:array<int,string>}
     */
    private function entrySummary(WorkRequestEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'formSlug' => $entry->form_slug,
            'createdAt' => $entry->created_at?->toIso8601String(),
            'firstName' => $entry->first_name,
            'lastName' => $entry->last_name,
            'email' => $entry->email,
            'eventName' => $entry->event_name,
            'requestTypes' => $this->requestTypes($entry),
        ];
    }

    /**
     * @return array{id:int,formSlug:string,createdAt:string|null,updatedAt:string|null,firstName:string|null,lastName:string|null,email:string|null,cellphone:string|null,congregation:string|null,eventName:string|null,requestTypes:array<int,string>,payload:array<string,mixed>|null,payloadJson:string}
     */
    private function entryDetail(WorkRequestEntry $entry): array
    {
        $payload = $entry->payload;

        return [
            'id' => $entry->id,
            'formSlug' => $entry->form_slug,
            'createdAt' => $entry->created_at?->toIso8601String(),
            'updatedAt' => $entry->updated_at?->toIso8601String(),
            'firstName' => $entry->first_name,
            'lastName' => $entry->last_name,
            'email' => $entry->email,
            'cellphone' => $entry->cellphone,
            'congregation' => $entry->congregation,
            'eventName' => $entry->event_name,
            'requestTypes' => $this->requestTypes($entry),
            'payload' => is_array($payload) ? $payload : null,
            'payloadJson' => json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '{}',
        ];
    }
}
