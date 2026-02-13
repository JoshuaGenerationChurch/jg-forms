<?php

namespace App\Http\Controllers\WorkRequest;

use App\Http\Controllers\Controller;
use App\Models\WorkForm;
use App\Models\WorkRequestEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkFormController extends Controller
{
    public function publicIndex(): Response
    {
        $forms = WorkForm::query()
            ->where('is_active', true)
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
            ->values();

        return Inertia::render('forms/index', [
            'forms' => $forms,
        ]);
    }

    public function adminIndex(): Response
    {
        $forms = WorkForm::query()
            ->orderBy('id')
            ->get()
            ->map(function (WorkForm $form): array {
                $entryCount = WorkRequestEntry::query()
                    ->where('form_slug', $form->slug)
                    ->count();

                return [
                    'slug' => $form->slug,
                    'title' => $form->title,
                    'description' => $form->description ?? '',
                    'url' => $form->url,
                    'isActive' => $form->is_active,
                    'entryCount' => $entryCount,
                ];
            })
            ->values();

        return Inertia::render('admin/forms/index', [
            'forms' => $forms,
        ]);
    }

    public function adminShow(string $formSlug): Response
    {
        $form = $this->findForm($formSlug);

        $entryCount = WorkRequestEntry::query()
            ->where('form_slug', $form->slug)
            ->count();

        return Inertia::render('admin/forms/show', [
            'form' => [
                'slug' => $form->slug,
                'title' => $form->title,
                'description' => $form->description ?? '',
                'url' => $form->url,
                'isActive' => $form->is_active,
                'entryCount' => $entryCount,
            ],
        ]);
    }

    public function adminEdit(string $formSlug): Response
    {
        $form = $this->findForm($formSlug);

        return Inertia::render('admin/forms/edit', [
            'form' => [
                'slug' => $form->slug,
                'title' => $form->title,
                'description' => $form->description ?? '',
                'url' => $form->url,
                'isActive' => $form->is_active,
            ],
        ]);
    }

    public function adminUpdate(Request $request, string $formSlug): RedirectResponse
    {
        $form = $this->findForm($formSlug);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'url' => ['required', 'string', 'max:255'],
            'isActive' => ['required', 'boolean'],
        ]);

        $form->update([
            'title' => (string) $validated['title'],
            'description' => (string) ($validated['description'] ?? ''),
            'url' => (string) $validated['url'],
            'is_active' => (bool) $validated['isActive'],
        ]);

        return redirect()->route('admin.forms.index');
    }

    public function adminDestroy(string $formSlug): RedirectResponse
    {
        $form = $this->findForm($formSlug);

        $hasEntries = WorkRequestEntry::query()
            ->where('form_slug', $form->slug)
            ->exists();

        if ($hasEntries) {
            return back()->withErrors([
                'form' => 'Cannot delete a form that already has entries.',
            ]);
        }

        $form->delete();

        return redirect()->route('admin.forms.index');
    }

    private function findForm(string $formSlug): WorkForm
    {
        return WorkForm::query()
            ->where('slug', $formSlug)
            ->firstOrFail();
    }
}
