<?php

namespace App\Providers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use LaravelWebauthn\Facades\Webauthn;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Disable automatic WebAuthn route registration BEFORE boot
        // (we define routes manually in web.php)
        Webauthn::ignoreRoutes();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureWebauthn();
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }

    protected function configureWebauthn(): void
    {
        // Enable userless login - find user by credential's userHandle
        Webauthn::authenticateUsing(function ($request) {
            if (config('webauthn.userless')) {
                // Get the userHandle from the credential response
                $userHandle = $request->input('response.userHandle');

                if ($userHandle) {
                    // Decode base64url userHandle to get user ID
                    $userId = base64_decode(strtr($userHandle, '-_', '+/'));

                    // Find and return the user
                    return User::find($userId);
                }
            }

            return null;
        });
    }
}
