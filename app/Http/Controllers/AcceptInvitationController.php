<?php

namespace App\Http\Controllers;

use App\Services\AdminInvitationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AcceptInvitationController extends Controller
{
    public function __invoke(
        Request $request,
        AdminInvitationService $invitationService,
        string $token,
    ): RedirectResponse {
        $invitation = $invitationService->findValidByToken($token);

        if ($invitation === null) {
            return redirect()->route('register');
        }

        if (Auth::check()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return redirect()->route('register', [
            'invite' => $token,
            'email' => $invitation->email,
        ]);
    }
}
