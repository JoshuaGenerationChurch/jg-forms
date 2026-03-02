<?php

namespace App\Http\Controllers\WorkRequest;

use App\Http\Controllers\Controller;
use App\Mail\WorkFormSubmissionNotificationMail;
use App\Mail\WorkFormTemplateNotificationMail;
use App\Models\WorkForm;
use App\Models\WorkFormEmailTemplate;
use App\Models\WorkRequestEntry;
use App\Services\RecaptchaEnterpriseService;
use App\Services\WorkFormEmailTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\Mime\Address;
use Throwable;

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

        $entry = WorkRequestEntry::query()->create([
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

        $this->sendSubmissionNotifications($entry, $this->findForm('work-request'));

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

        $entry = WorkRequestEntry::query()->create([
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

        $this->sendSubmissionNotifications($entry, $form);

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

    /**
     * @param  array{slug?: string, title?: string, description?: string, url?: string}|null  $form
     */
    private function sendSubmissionNotifications(
        WorkRequestEntry $entry,
        ?array $form = null,
    ): void {
        $templateService = app(WorkFormEmailTemplateService::class);
        $workForm = WorkForm::query()
            ->where('slug', $entry->form_slug)
            ->first();

        if ($workForm) {
            $templates = $workForm->emailTemplates()
                ->where('is_active', true)
                ->orderBy('position')
                ->orderBy('id')
                ->get();

            if ($templates->isNotEmpty()) {
                foreach ($templates as $template) {
                    $this->sendTemplateNotification(
                        $template,
                        $entry,
                        $form,
                        $templateService,
                    );
                }

                return;
            }
        }

        $recipients = config('workforms.notification_recipients', []);
        if (! is_array($recipients) || count($recipients) === 0) {
            return;
        }

        foreach ($recipients as $recipient) {
            if (! is_array($recipient)) {
                continue;
            }

            $email = strtolower(trim((string) ($recipient['email'] ?? '')));
            if ($email === '') {
                continue;
            }

            $name = trim((string) ($recipient['name'] ?? ''));

            try {
                $recipientAddress = $name !== ''
                    ? new Address($email, $name)
                    : new Address($email);

                Mail::to($recipientAddress)->send(
                    new WorkFormSubmissionNotificationMail($entry, $form),
                );
            } catch (Throwable $exception) {
                report($exception);
            }
        }
    }

    private function matchesDevBoardRoutingRule(WorkRequestEntry $entry): bool
    {
        return $entry->includes_dates_venue && $entry->includes_registration;
    }

    private function matchesDesignBoardRoutingRule(WorkRequestEntry $entry): bool
    {
        return $entry->includes_graphics
            || $entry->includes_graphics_digital
            || $entry->includes_graphics_print
            || $entry->includes_signage;
    }

    /**
     * Detect routing tags from template identity and Trello-recipient metadata.
     *
     * @return array<int, string>
     */
    private function inferTemplateRoutingTags(WorkFormEmailTemplate $template): array
    {
        $tags = [];
        $templateIdentity = strtolower(
            trim(sprintf('%s %s', (string) $template->name, (string) $template->subject)),
        );

        if (str_contains($templateIdentity, 'trello') && str_contains($templateIdentity, 'dev')) {
            $tags[] = 'dev';
        }

        if (str_contains($templateIdentity, 'trello') && str_contains($templateIdentity, 'design')) {
            $tags[] = 'design';
        }

        $recipientLists = [
            is_array($template->to_recipients) ? $template->to_recipients : [],
            is_array($template->cc_recipients) ? $template->cc_recipients : [],
            is_array($template->bcc_recipients) ? $template->bcc_recipients : [],
        ];

        foreach ($recipientLists as $recipientList) {
            foreach ($recipientList as $recipient) {
                if (! is_array($recipient)) {
                    continue;
                }

                $email = strtolower(trim((string) ($recipient['email'] ?? '')));
                if ($email === '' || ! str_contains($email, 'boards.trello.com')) {
                    continue;
                }

                $name = strtolower(trim((string) ($recipient['name'] ?? '')));
                $identity = trim($name.' '.$email);

                if (str_contains($identity, 'dev')) {
                    $tags[] = 'dev';
                }

                if (str_contains($identity, 'design')) {
                    $tags[] = 'design';
                }
            }
        }

        return array_values(array_unique($tags));
    }

    /**
     * @param  array{slug?: string, title?: string, description?: string, url?: string}|null  $form
     */
    private function sendTemplateNotification(
        WorkFormEmailTemplate $template,
        WorkRequestEntry $entry,
        ?array $form,
        WorkFormEmailTemplateService $templateService,
    ): void {
        if (! $this->shouldDispatchWorkRequestTemplate($template, $entry)) {
            return;
        }

        $templateTags = $this->inferTemplateRoutingTags($template);
        $toRecipients = $templateService->mergeRecipientsWithDefaults(
            is_array($template->to_recipients) ? $template->to_recipients : [],
            $template->use_default_recipients,
        );
        $toRecipients = $this->filterTemplateRecipientsForEntry(
            $toRecipients,
            $entry,
            $template,
            $templateTags,
        );

        if (count($toRecipients) === 0) {
            return;
        }

        $ccRecipients = $templateService->normalizeRecipientsArray(
            is_array($template->cc_recipients) ? $template->cc_recipients : [],
        );
        $ccRecipients = $this->filterTemplateRecipientsForEntry(
            $ccRecipients,
            $entry,
            $template,
            $templateTags,
        );
        $bccRecipients = $templateService->normalizeRecipientsArray(
            is_array($template->bcc_recipients) ? $template->bcc_recipients : [],
        );
        $bccRecipients = $this->filterTemplateRecipientsForEntry(
            $bccRecipients,
            $entry,
            $template,
            $templateTags,
        );

        $placeholderMap = $templateService->buildPlaceholderMap($entry, $form);
        $subject = $entry->form_slug === 'work-request'
            ? $templateService->workRequestAutoSubject($entry)
            : $templateService->renderWithPlaceholders($template->subject, $placeholderMap);
        $headingTemplate = (string) ($template->heading ?? '');
        $heading = $templateService->renderWithPlaceholders($headingTemplate, $placeholderMap);
        $body = $templateService->renderWithPlaceholders($template->body, $placeholderMap);
        $body = $this->appendWorkRequestRoutingSummaryForHumanRecipients(
            $body,
            $entry,
            $toRecipients,
            $ccRecipients,
            $bccRecipients,
        );

        try {
            $pendingMail = Mail::to($this->mapRecipientsToAddresses($toRecipients));

            if ($ccRecipients !== []) {
                $pendingMail->cc($this->mapRecipientsToAddresses($ccRecipients));
            }

            if ($bccRecipients !== []) {
                $pendingMail->bcc($this->mapRecipientsToAddresses($bccRecipients));
            }

            $pendingMail->send(new WorkFormTemplateNotificationMail(
                $subject,
                $heading,
                $body,
            ));
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    /**
     * @param  array<int, array{email:string,name:string|null}>  $recipients
     * @param  array<int, string>  $templateTags
     * @return array<int, array{email:string,name:string|null}>
     */
    private function filterTemplateRecipientsForEntry(
        array $recipients,
        WorkRequestEntry $entry,
        WorkFormEmailTemplate $template,
        array $templateTags,
    ): array {
        if ($entry->form_slug !== 'work-request') {
            return $recipients;
        }

        $triggerEvent = strtolower(trim((string) $template->trigger_event));
        if ($triggerEvent === 'work_request_dev') {
            return $this->matchesDevBoardRoutingRule($entry) ? $recipients : [];
        }

        if ($triggerEvent === 'work_request_design') {
            return $this->matchesDesignBoardRoutingRule($entry) ? $recipients : [];
        }

        $devMatches = $this->matchesDevBoardRoutingRule($entry);
        $designMatches = $this->matchesDesignBoardRoutingRule($entry);
        $filteredRecipients = [];

        foreach ($recipients as $recipient) {
            $recipientTag = $this->inferRecipientRoutingTag($recipient, $templateTags);

            if ($recipientTag === 'blocked') {
                continue;
            }

            if ($recipientTag === 'dev' && ! $devMatches) {
                continue;
            }

            if ($recipientTag === 'design' && ! $designMatches) {
                continue;
            }

            $filteredRecipients[] = $recipient;
        }

        return $filteredRecipients;
    }

    /**
     * @param  array{email:string,name:string|null}  $recipient
     * @param  array<int, string>  $templateTags
     */
    private function inferRecipientRoutingTag(array $recipient, array $templateTags): string
    {
        $email = strtolower(trim((string) ($recipient['email'] ?? '')));
        $name = strtolower(trim((string) ($recipient['name'] ?? '')));
        $identity = trim($name.' '.$email);

        if (! str_contains($email, 'boards.trello.com')) {
            return 'always';
        }

        $strictDevEmails = $this->configuredRecipientEmails('workforms.trello_dev_recipient_emails');
        $strictDesignEmails = $this->configuredRecipientEmails('workforms.trello_design_recipient_emails');
        $strictRoutingEnabled = $strictDevEmails !== [] || $strictDesignEmails !== [];

        if ($strictRoutingEnabled) {
            if (in_array($email, $strictDevEmails, true)) {
                return 'dev';
            }

            if (in_array($email, $strictDesignEmails, true)) {
                return 'design';
            }

            return 'blocked';
        }

        if (str_contains($identity, 'dev')) {
            return 'dev';
        }

        if (str_contains($identity, 'design')) {
            return 'design';
        }

        $hasDevTag = in_array('dev', $templateTags, true);
        $hasDesignTag = in_array('design', $templateTags, true);

        if ($hasDevTag && ! $hasDesignTag) {
            return 'dev';
        }

        if ($hasDesignTag && ! $hasDevTag) {
            return 'design';
        }

        return 'always';
    }

    /**
     * @param  array<int, array{email:string,name:string|null}>  $toRecipients
     * @param  array<int, array{email:string,name:string|null}>  $ccRecipients
     * @param  array<int, array{email:string,name:string|null}>  $bccRecipients
     */
    private function appendWorkRequestRoutingSummaryForHumanRecipients(
        string $body,
        WorkRequestEntry $entry,
        array $toRecipients,
        array $ccRecipients,
        array $bccRecipients,
    ): string {
        if ($entry->form_slug !== 'work-request') {
            return $body;
        }

        $allRecipients = array_merge($toRecipients, $ccRecipients, $bccRecipients);
        if (! $this->hasNonTrelloRecipient($allRecipients)) {
            return $body;
        }

        $routeDev = $this->matchesDevBoardRoutingRule($entry);
        $routeDesign = $this->matchesDesignBoardRoutingRule($entry);
        $targets = [];
        if ($routeDev) {
            $targets[] = 'JG Dev Board';
        }
        if ($routeDesign) {
            $targets[] = 'JG Design Board';
        }

        $targetText = $targets === [] ? 'None' : implode(', ', $targets);
        $hasHtml = preg_match('/<[^>]+>/', $body) === 1;

        if ($hasHtml) {
            $summary = '<hr><p><strong>Routing Summary</strong></p><ul>'
                .'<li><strong>Dev board:</strong> '.($routeDev ? 'Yes' : 'No').'</li>'
                .'<li><strong>Design board:</strong> '.($routeDesign ? 'Yes' : 'No').'</li>'
                .'<li><strong>Targets:</strong> '.$targetText.'</li>'
                .'</ul>';

            return rtrim($body).$summary;
        }

        $summary = "\n\nRouting Summary\n"
            .'Dev board: '.($routeDev ? 'Yes' : 'No')."\n"
            .'Design board: '.($routeDesign ? 'Yes' : 'No')."\n"
            .'Targets: '.$targetText;

        return rtrim($body).$summary;
    }

    /**
     * @param  array<int, array{email:string,name:string|null}>  $recipients
     */
    private function hasNonTrelloRecipient(array $recipients): bool
    {
        foreach ($recipients as $recipient) {
            $email = strtolower(trim((string) ($recipient['email'] ?? '')));
            if ($email === '') {
                continue;
            }

            if (! str_contains($email, 'boards.trello.com')) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<int, string>
     */
    private function configuredRecipientEmails(string $configKey): array
    {
        $configured = config($configKey, []);
        if (! is_array($configured)) {
            return [];
        }

        $emails = [];
        foreach ($configured as $value) {
            if (! is_string($value)) {
                continue;
            }

            $email = strtolower(trim($value));
            if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                continue;
            }

            $emails[$email] = $email;
        }

        return array_values($emails);
    }

    private function shouldDispatchWorkRequestTemplate(
        WorkFormEmailTemplate $template,
        WorkRequestEntry $entry,
    ): bool {
        if ($entry->form_slug !== 'work-request') {
            return true;
        }

        $templateIdentity = strtolower(trim((string) $template->name));
        $templateIdentity = preg_replace('/\s+/', ' ', $templateIdentity) ?? $templateIdentity;

        if ($templateIdentity === '') {
            return true;
        }

        if (str_contains($templateIdentity, 'hanri') && str_contains($templateIdentity, 'milo')) {
            return true;
        }

        if (str_contains($templateIdentity, 'trello') && str_contains($templateIdentity, 'dev')) {
            return $this->matchesDevBoardRoutingRule($entry);
        }

        if (str_contains($templateIdentity, 'trello') && str_contains($templateIdentity, 'design')) {
            return $this->matchesDesignBoardRoutingRule($entry);
        }

        $hasEventOrRegistration = $entry->includes_dates_venue || $entry->includes_registration;
        $hasDigital = $entry->includes_graphics_digital;
        $hasPrint = $entry->includes_graphics_print;
        $hasSignage = $entry->includes_signage;

        $isDigitalPrintOnly = ! $hasEventOrRegistration && $hasDigital && $hasPrint && ! $hasSignage;
        $isDigitalOnly = ! $hasEventOrRegistration && $hasDigital && ! $hasPrint && ! $hasSignage;
        $isPrintOnly = ! $hasEventOrRegistration && ! $hasDigital && $hasPrint && ! $hasSignage;
        $isSignageOnly = ! $hasEventOrRegistration && ! $hasDigital && ! $hasPrint && $hasSignage;

        if ($this->isGraphicsDigitalPrintTemplate($templateIdentity)) {
            return $isDigitalPrintOnly;
        }

        if ($this->isGraphicsDigitalTemplate($templateIdentity)) {
            return $isDigitalOnly;
        }

        if ($this->isGraphicsPrintTemplate($templateIdentity)) {
            return $isPrintOnly;
        }

        if ($this->isSignageTemplate($templateIdentity)) {
            return $isSignageOnly;
        }

        return true;
    }

    private function isGraphicsDigitalPrintTemplate(string $templateIdentity): bool
    {
        if (! str_contains($templateIdentity, 'graphics')) {
            return false;
        }

        return str_contains($templateIdentity, 'digital + print')
            || str_contains($templateIdentity, 'digital+print')
            || (str_contains($templateIdentity, 'digital') && str_contains($templateIdentity, 'print'));
    }

    private function isGraphicsDigitalTemplate(string $templateIdentity): bool
    {
        if ($this->isGraphicsDigitalPrintTemplate($templateIdentity)) {
            return false;
        }

        return str_contains($templateIdentity, 'graphics-digital')
            || str_contains($templateIdentity, 'graphics digital')
            || str_contains($templateIdentity, 'graphics - digital')
            || str_contains($templateIdentity, 'digital media');
    }

    private function isGraphicsPrintTemplate(string $templateIdentity): bool
    {
        if ($this->isGraphicsDigitalPrintTemplate($templateIdentity)) {
            return false;
        }

        return str_contains($templateIdentity, 'graphics-print')
            || str_contains($templateIdentity, 'graphics print')
            || str_contains($templateIdentity, 'graphics - print')
            || str_contains($templateIdentity, 'print media');
    }

    private function isSignageTemplate(string $templateIdentity): bool
    {
        return $templateIdentity === 'signage' || str_starts_with($templateIdentity, 'signage');
    }

    /**
     * @param  array<int, array{email:string,name:string|null}>  $recipients
     * @return array<int, Address>
     */
    private function mapRecipientsToAddresses(array $recipients): array
    {
        return collect($recipients)
            ->map(static function (array $recipient): Address {
                $name = trim((string) ($recipient['name'] ?? ''));
                $email = trim((string) ($recipient['email'] ?? ''));

                if ($name !== '') {
                    return new Address($email, $name);
                }

                return new Address($email);
            })
            ->values()
            ->all();
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
