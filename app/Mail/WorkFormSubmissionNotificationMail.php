<?php

namespace App\Mail;

use App\Models\WorkRequestEntry;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WorkFormSubmissionNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array{slug?: string, title?: string, description?: string, url?: string}|null  $form
     */
    public function __construct(
        public WorkRequestEntry $entry,
        public ?array $form = null,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $formTitle = $this->form['title']
            ?? ucwords(str_replace('-', ' ', (string) $this->entry->form_slug));

        return new Envelope(
            subject: sprintf('[JG Forms] New submission: %s', (string) $formTitle),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $payload = is_array($this->entry->payload) ? $this->entry->payload : [];
        $entryUrl = route('admin.forms.entries.entry.show', [
            'formSlug' => (string) $this->entry->form_slug,
            'entry' => $this->entry->id,
        ]);

        $formTitle = $this->form['title']
            ?? ucwords(str_replace('-', ' ', (string) $this->entry->form_slug));

        return new Content(
            view: 'emails.workforms.submission-notification',
            with: [
                'entry' => $this->entry,
                'payload' => $payload,
                'entryUrl' => $entryUrl,
                'formTitle' => $formTitle,
                'submittedAt' => $this->entry->created_at?->timezone(config('app.timezone'))->format('Y-m-d H:i'),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
