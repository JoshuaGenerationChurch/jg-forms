@php
    $requesterName = trim(sprintf(
        '%s %s',
        (string) ($entry->first_name ?? ''),
        (string) ($entry->last_name ?? ''),
    ));

    if ($requesterName === '') {
        $requesterName = 'Not provided';
    }

    $requesterEmail = (string) ($entry->email ?? '');
    $entryEventName = (string) ($entry->event_name ?? '');
    $entryCongregation = (string) ($entry->congregation ?? '');
@endphp

<p>A new form entry has been submitted on JG Forms.</p>

<p><strong>Form:</strong> {{ $formTitle }}</p>
<p><strong>Entry ID:</strong> #{{ $entry->id }}</p>
<p><strong>Submitted At:</strong> {{ $submittedAt ?? 'Unknown' }}</p>
<p><strong>Requester:</strong> {{ $requesterName }}</p>
<p><strong>Requester Email:</strong> {{ $requesterEmail !== '' ? $requesterEmail : 'Not provided' }}</p>
<p><strong>Event Name:</strong> {{ $entryEventName !== '' ? $entryEventName : 'Not provided' }}</p>
<p><strong>Congregation:</strong> {{ $entryCongregation !== '' ? $entryCongregation : 'Not provided' }}</p>

<p>
    <strong>View Entry:</strong>
    <a href="{{ $entryUrl }}">{{ $entryUrl }}</a>
</p>
