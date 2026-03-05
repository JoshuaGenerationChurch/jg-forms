<?php

namespace App\Services;

use App\Models\AdminInvitation;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class AdminInvitationService
{
    /**
     * @return array{invitation: AdminInvitation, token: string, registrationUrl: string}
     */
    public function issueInvitation(
        string $email,
        string $roleName,
        ?User $invitedBy,
        int $expiresInDays,
    ): array {
        $normalizedEmail = strtolower(trim($email));
        $token = Str::random(64);
        $tokenHash = AdminInvitation::hashToken($token);
        $expiresAt = Carbon::now()->addDays(max(1, $expiresInDays));

        $role = Role::query()->where('name', $roleName)->firstOrFail();

        $invitation = DB::transaction(function () use (
            $normalizedEmail,
            $tokenHash,
            $role,
            $invitedBy,
            $expiresAt,
        ): AdminInvitation {
            AdminInvitation::query()
                ->where('email', $normalizedEmail)
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => Carbon::now()]);

            return AdminInvitation::query()->create([
                'email' => $normalizedEmail,
                'token_hash' => $tokenHash,
                'role_name' => (string) $role->name,
                'invited_by_user_id' => $invitedBy?->id,
                'expires_at' => $expiresAt,
            ]);
        });

        $registrationUrl = route('register', [
            'invite' => $token,
            'email' => $normalizedEmail,
        ]);

        return [
            'invitation' => $invitation,
            'token' => $token,
            'registrationUrl' => $registrationUrl,
        ];
    }

    public function findValidByToken(?string $token): ?AdminInvitation
    {
        if (! is_string($token) || trim($token) === '') {
            return null;
        }

        $invitation = AdminInvitation::query()
            ->where('token_hash', AdminInvitation::hashToken($token))
            ->first();

        if (! $invitation || ! $invitation->isValid()) {
            return null;
        }

        return $invitation;
    }

    public function acceptInvitation(AdminInvitation $invitation, User $user): void
    {
        $invitation->update([
            'accepted_at' => Carbon::now(),
            'accepted_by_user_id' => $user->id,
        ]);
    }
}
