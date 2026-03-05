<p>You have been invited to access JG Forms.</p>

<p><strong>Email:</strong> {{ $recipientEmail }}</p>
<p><strong>Role:</strong> {{ $roleName }}</p>
<p><strong>Invitation expires:</strong> {{ $expiresAt }}</p>

<p>
    Complete registration using this secure link:
    <a href="{{ $registrationUrl }}">{{ $registrationUrl }}</a>
</p>
