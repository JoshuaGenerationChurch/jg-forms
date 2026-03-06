<?php

namespace App\Http\Controllers;

use App\Mail\ContactSubmissionNotificationMail;
use App\Models\ContactSubmission;
use App\Services\WorkFormEmailTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\Mime\Address;
use Throwable;

class ContactUsController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('contact-us');
    }

    public function store(
        Request $request,
        WorkFormEmailTemplateService $emailTemplateService,
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $submission = ContactSubmission::query()->create([
            'name' => trim((string) $validated['name']),
            'email' => trim((string) $validated['email']),
            'subject' => trim((string) $validated['subject']),
            'message' => trim((string) $validated['message']),
        ]);

        $mailQueueConnection = trim((string) config('workforms.mail_queue_connection', 'background'));
        $recipients = $emailTemplateService->defaultRecipients();

        foreach ($recipients as $recipient) {
            $email = strtolower(trim((string) ($recipient['email'] ?? '')));
            if ($email === '') {
                continue;
            }

            $name = trim((string) ($recipient['name'] ?? ''));

            try {
                $recipientAddress = $name !== ''
                    ? new Address($email, $name)
                    : new Address($email);

                Mail::to($recipientAddress)
                    ->queue(
                        (new ContactSubmissionNotificationMail($submission))
                            ->onConnection($mailQueueConnection !== '' ? $mailQueueConnection : 'background')
                    );
            } catch (Throwable $exception) {
                report($exception);
            }
        }

        return back()->with('success', 'Thanks. Your message has been sent.');
    }
}
