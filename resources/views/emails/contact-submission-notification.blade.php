<p>A new Contact us submission was received.</p>

<p><strong>Name:</strong> {{ $submission->name }}</p>
<p><strong>Email:</strong> {{ $submission->email }}</p>
<p><strong>Subject:</strong> {{ $submission->subject }}</p>
<p><strong>Submitted At:</strong> {{ $submission->created_at?->timezone(config('app.timezone'))->format('Y-m-d H:i') }}</p>

<p><strong>Message:</strong></p>
<p>{!! nl2br(e($submission->message)) !!}</p>
