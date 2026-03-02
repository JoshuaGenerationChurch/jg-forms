<?php

namespace App\Http\Controllers\WorkRequest;

use App\Http\Controllers\Controller;
use App\Models\WorkForm;
use App\Models\WorkFormEmailTemplate;
use App\Services\WorkFormEmailTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkFormEmailTemplateController extends Controller
{
    public function index(): Response
    {
        $forms = WorkForm::query()
            ->withCount('emailTemplates')
            ->withCount([
                'emailTemplates as activeEmailTemplateCount' => fn ($query) => $query->where('is_active', true),
            ])
            ->orderBy('id')
            ->get()
            ->map(fn (WorkForm $form): array => [
                'slug' => $form->slug,
                'title' => $form->title,
                'description' => $form->description ?? '',
                'url' => $form->url,
                'emailTemplateCount' => (int) $form->email_templates_count,
                'activeEmailTemplateCount' => (int) $form->activeEmailTemplateCount,
            ])
            ->values();

        return Inertia::render('admin/forms/email-templates-index', [
            'forms' => $forms,
        ]);
    }

    public function show(string $formSlug, WorkFormEmailTemplateService $emailTemplateService): Response
    {
        $form = $this->findForm($formSlug);

        $templates = $form->emailTemplates()
            ->orderBy('position')
            ->orderBy('id')
            ->get()
            ->map(fn (WorkFormEmailTemplate $template): array => $this->templateResponse($template))
            ->values();

        return Inertia::render('admin/forms/email-templates', [
            'form' => [
                'slug' => $form->slug,
                'title' => $form->title,
                'description' => $form->description ?? '',
                'url' => $form->url,
            ],
            'templates' => $templates,
            'defaultRecipients' => $emailTemplateService->defaultRecipients(),
            'placeholders' => $emailTemplateService->availablePlaceholdersForForm($form),
            'triggerOptions' => [
                [
                    'value' => 'submission_created',
                    'label' => 'On Submission',
                ],
            ],
        ]);
    }

    public function store(
        Request $request,
        string $formSlug,
        WorkFormEmailTemplateService $emailTemplateService,
    ): RedirectResponse {
        $form = $this->findForm($formSlug);
        $validated = $this->validateTemplatePayload($request);

        $toRecipients = $emailTemplateService->parseRecipientsString((string) ($validated['toRecipients'] ?? ''));
        $ccRecipients = $emailTemplateService->parseRecipientsString((string) ($validated['ccRecipients'] ?? ''));
        $bccRecipients = $emailTemplateService->parseRecipientsString((string) ($validated['bccRecipients'] ?? ''));
        $useDefaultRecipients = (bool) $validated['useDefaultRecipients'];
        $subject = $form->slug === 'work-request'
            ? '{{entry.auto_subject}}'
            : trim((string) $validated['subject']);

        if ($toRecipients === [] && ! $useDefaultRecipients) {
            return back()->withErrors([
                'toRecipients' => 'Add at least one To recipient or enable default recipients.',
            ])->withInput();
        }

        $form->emailTemplates()->create([
            'trigger_event' => (string) $validated['triggerEvent'],
            'name' => trim((string) $validated['name']),
            'subject' => $subject,
            'heading' => trim((string) ($validated['heading'] ?? '')) ?: null,
            'body' => (string) $validated['body'],
            'to_recipients' => $toRecipients,
            'cc_recipients' => $ccRecipients,
            'bcc_recipients' => $bccRecipients,
            'use_default_recipients' => $useDefaultRecipients,
            'is_active' => (bool) $validated['isActive'],
            'position' => (int) $validated['position'],
        ]);

        return back();
    }

    public function update(
        Request $request,
        string $formSlug,
        WorkFormEmailTemplate $template,
        WorkFormEmailTemplateService $emailTemplateService,
    ): RedirectResponse {
        $form = $this->findForm($formSlug);
        abort_unless($template->work_form_id === $form->id, 404);

        $validated = $this->validateTemplatePayload($request);

        $toRecipients = $emailTemplateService->parseRecipientsString((string) ($validated['toRecipients'] ?? ''));
        $ccRecipients = $emailTemplateService->parseRecipientsString((string) ($validated['ccRecipients'] ?? ''));
        $bccRecipients = $emailTemplateService->parseRecipientsString((string) ($validated['bccRecipients'] ?? ''));
        $useDefaultRecipients = (bool) $validated['useDefaultRecipients'];
        $subject = $form->slug === 'work-request'
            ? '{{entry.auto_subject}}'
            : trim((string) $validated['subject']);

        if ($toRecipients === [] && ! $useDefaultRecipients) {
            return back()->withErrors([
                'toRecipients' => 'Add at least one To recipient or enable default recipients.',
            ])->withInput();
        }

        $template->update([
            'trigger_event' => (string) $validated['triggerEvent'],
            'name' => trim((string) $validated['name']),
            'subject' => $subject,
            'heading' => trim((string) ($validated['heading'] ?? '')) ?: null,
            'body' => (string) $validated['body'],
            'to_recipients' => $toRecipients,
            'cc_recipients' => $ccRecipients,
            'bcc_recipients' => $bccRecipients,
            'use_default_recipients' => $useDefaultRecipients,
            'is_active' => (bool) $validated['isActive'],
            'position' => (int) $validated['position'],
        ]);

        return back();
    }

    public function destroy(
        string $formSlug,
        WorkFormEmailTemplate $template,
    ): RedirectResponse {
        $form = $this->findForm($formSlug);
        abort_unless($template->work_form_id === $form->id, 404);

        $template->delete();

        return back();
    }

    public function reorder(Request $request, string $formSlug): RedirectResponse
    {
        $form = $this->findForm($formSlug);

        $validated = $request->validate([
            'templateIds' => ['required', 'array'],
            'templateIds.*' => ['required', 'integer'],
        ]);

        /** @var array<int, int> $orderedTemplateIds */
        $orderedTemplateIds = array_values(array_unique(array_map(
            static fn (mixed $value): int => (int) $value,
            $validated['templateIds'],
        )));

        $existingTemplateIds = $form->emailTemplates()
            ->pluck('id')
            ->map(static fn (mixed $value): int => (int) $value)
            ->values()
            ->all();

        sort($orderedTemplateIds);
        sort($existingTemplateIds);

        if ($orderedTemplateIds !== $existingTemplateIds) {
            return back()->withErrors([
                'templateIds' => 'Template order is out of date. Reload and try again.',
            ]);
        }

        DB::transaction(function () use ($form, $validated): void {
            /** @var array<int, int> $templateIdsInOrder */
            $templateIdsInOrder = array_values(array_unique(array_map(
                static fn (mixed $value): int => (int) $value,
                $validated['templateIds'],
            )));

            foreach ($templateIdsInOrder as $index => $templateId) {
                WorkFormEmailTemplate::query()
                    ->where('work_form_id', $form->id)
                    ->where('id', $templateId)
                    ->update(['position' => $index]);
            }
        });

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function validateTemplatePayload(Request $request): array
    {
        return $request->validate([
            'triggerEvent' => ['required', 'string', Rule::in(['submission_created'])],
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'heading' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:30000'],
            'toRecipients' => ['nullable', 'string', 'max:5000'],
            'ccRecipients' => ['nullable', 'string', 'max:5000'],
            'bccRecipients' => ['nullable', 'string', 'max:5000'],
            'useDefaultRecipients' => ['required', 'boolean'],
            'isActive' => ['required', 'boolean'],
            'position' => ['required', 'integer', 'min:0', 'max:10000'],
        ]);
    }

    private function findForm(string $formSlug): WorkForm
    {
        return WorkForm::query()
            ->where('slug', $formSlug)
            ->firstOrFail();
    }

    /**
     * @return array{
     *   id:int,
     *   triggerEvent:string,
     *   name:string,
     *   subject:string,
     *   heading:string|null,
     *   body:string,
     *   toRecipients:array<int,array{email:string,name:string|null}>,
     *   ccRecipients:array<int,array{email:string,name:string|null}>,
     *   bccRecipients:array<int,array{email:string,name:string|null}>,
     *   useDefaultRecipients:bool,
     *   isActive:bool,
     *   position:int
     * }
     */
    private function templateResponse(WorkFormEmailTemplate $template): array
    {
        return [
            'id' => $template->id,
            'triggerEvent' => $template->trigger_event,
            'name' => $template->name,
            'subject' => $template->subject,
            'heading' => $template->heading,
            'body' => $template->body,
            'toRecipients' => $template->to_recipients ?? [],
            'ccRecipients' => $template->cc_recipients ?? [],
            'bccRecipients' => $template->bcc_recipients ?? [],
            'useDefaultRecipients' => $template->use_default_recipients,
            'isActive' => $template->is_active,
            'position' => $template->position,
        ];
    }
}
