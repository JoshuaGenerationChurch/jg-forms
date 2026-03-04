<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MailHealthCheckMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $appName,
        public string $appUrl,
        public string $mailerName,
        public string $transport,
        public string $sentAt,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[JG Forms] Mail health check',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.mail-health-check',
            with: [
                'appName' => $this->appName,
                'appUrl' => $this->appUrl,
                'mailer' => $this->mailerName,
                'transport' => $this->transport,
                'sentAt' => $this->sentAt,
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
