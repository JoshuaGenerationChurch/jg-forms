<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AdminInvitationMail;
use App\Models\AdminInvitation;
use App\Services\AdminInvitationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class AdminInvitationController extends Controller
{
    public function index(): Response
    {
        $roles = Role::query()
            ->orderBy('name')
            ->get(['name'])
            ->pluck('name')
            ->values();

        $invitations = AdminInvitation::query()
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(function (AdminInvitation $invitation): array {
                $status = 'Pending';

                if ($invitation->revoked_at !== null) {
                    $status = 'Revoked';
                } elseif ($invitation->accepted_at !== null) {
                    $status = 'Accepted';
                } elseif ($invitation->isExpired()) {
                    $status = 'Expired';
                }

                return [
                    'id' => $invitation->id,
                    'email' => $invitation->email,
                    'roleName' => $invitation->role_name,
                    'status' => $status,
                    'expiresAt' => $invitation->expires_at?->toIso8601String(),
                    'invitedAt' => $invitation->created_at?->toIso8601String(),
                    'acceptedAt' => $invitation->accepted_at?->toIso8601String(),
                    'revokedAt' => $invitation->revoked_at?->toIso8601String(),
                ];
            })
            ->values();

        return Inertia::render('admin/invitations/index', [
            'roles' => $roles,
            'invitations' => $invitations,
        ]);
    }

    public function store(
        Request $request,
        AdminInvitationService $invitationService,
    ): RedirectResponse {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'roleName' => ['required', 'string', 'exists:roles,name'],
            'expiresInDays' => ['required', 'integer', 'min:1', 'max:30'],
        ]);

        $result = $invitationService->issueInvitation(
            email: (string) $validated['email'],
            roleName: (string) $validated['roleName'],
            invitedBy: $request->user(),
            expiresInDays: (int) $validated['expiresInDays'],
        );

        $mailQueueConnection = trim((string) config('workforms.mail_queue_connection', 'background'));

        Mail::to((string) $validated['email'])->queue((new AdminInvitationMail(
            recipientEmail: (string) $validated['email'],
            roleName: (string) $result['invitation']->role_name,
            registrationUrl: (string) $result['registrationUrl'],
            expiresAt: $result['invitation']->expiresAtHuman(),
        ))->onConnection($mailQueueConnection !== '' ? $mailQueueConnection : 'background'));

        return back()->with([
            'success' => 'Invitation created and queued for delivery.',
            'inviteLink' => $result['registrationUrl'],
        ]);
    }

    public function revoke(AdminInvitation $invitation): RedirectResponse
    {
        if ($invitation->accepted_at !== null || $invitation->revoked_at !== null) {
            return back();
        }

        $invitation->update([
            'revoked_at' => now(),
        ]);

        return back()->with('success', 'Invitation revoked.');
    }
}
