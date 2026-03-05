<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\AdminInvitation;
use App\Models\User;
use App\Services\AdminInvitationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Spatie\Permission\Models\Role;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(
        private AdminInvitationService $invitationService,
    ) {}

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $inviteOnlyRegistration = (bool) config('workforms.invite_only_registration', true);

        $rules = [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ];

        if ($inviteOnlyRegistration) {
            $rules['invite_token'] = ['required', 'string'];
        }

        Validator::make($input, $rules)
            ->after(function ($validator) use ($input, $inviteOnlyRegistration): void {
                if (! $inviteOnlyRegistration) {
                    return;
                }

                $inviteToken = trim((string) ($input['invite_token'] ?? ''));
                $invitation = $this->invitationService->findValidByToken($inviteToken);

                if (! $invitation) {
                    $validator->errors()->add('invite_token', 'Invitation link is invalid or expired.');

                    return;
                }

                $inputEmail = strtolower(trim((string) ($input['email'] ?? '')));
                if ($inputEmail !== strtolower($invitation->email)) {
                    $validator->errors()->add('email', 'This invitation is for a different email address.');
                }
            })
            ->validate();

        if (! $inviteOnlyRegistration) {
            $user = User::query()->create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            if (Role::query()->where('name', 'requester')->exists()) {
                $user->assignRole('requester');
            }

            return $user;
        }

        $invitation = $this->invitationService->findValidByToken((string) $input['invite_token']);
        if (! $invitation instanceof AdminInvitation) {
            throw ValidationException::withMessages([
                'invite_token' => 'Invitation link is invalid or expired.',
            ]);
        }

        return DB::transaction(function () use ($input, $invitation): User {
            $user = User::query()->create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            $user->assignRole($invitation->role_name);
            $this->invitationService->acceptInvitation($invitation, $user);

            return $user;
        });
    }
}
