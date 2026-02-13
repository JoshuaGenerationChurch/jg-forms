# Apple Passkey (WebAuthn) Implementation Guide

This guide covers the complete implementation of Apple Passkey support for the JoshGen Office application.

## Overview

Passkeys use the WebAuthn standard to provide passwordless authentication using biometric authentication (Face ID, Touch ID) or device PINs. This implementation adds passkey support to the existing Laravel Fortify authentication system.

## Frontend Implementation (Completed)

### 1. Files Created

#### TypeScript Types
- **`resources/js/types/webauthn.ts`** - WebAuthn credential types and API structures

#### Helper Functions
- **`resources/js/lib/webauthn.ts`** - Core WebAuthn functionality
  - Base64url encoding/decoding
  - Credential creation and authentication
  - Browser support detection

#### Action Controllers
- **`resources/js/actions/LaravelWebauthn/Http/Controllers/WebauthnController.ts`**
  - Registration endpoints
  - Authentication endpoints
  - Credential management endpoints

#### Components
- **`resources/js/components/passkey-registration.tsx`** - Passkey registration form
- **`resources/js/pages/settings/passkeys.tsx`** - Passkey management page
- **`resources/js/pages/auth/login.tsx`** - Updated with passkey login button

### 2. Features

- **Automatic Detection**: Checks if device supports passkeys
- **Conditional UI**: Shows passkey option only when supported
- **Error Handling**: Clear error messages for failed operations
- **Device Management**: Name and manage multiple passkeys
- **Visual Feedback**: Loading states and success/error messages

## Backend Implementation (Required)

### Step 1: Install Laravel WebAuthn Package

```bash
composer require asbiin/laravel-webauthn
```

### Step 2: Publish and Run Migrations

```bash
php artisan vendor:publish --provider="LaravelWebauthn\ServiceProvider"
php artisan migrate
```

This creates the `webauthn_keys` table to store user credentials.

### Step 3: Update User Model

Add the `WebauthnAuthenticatable` trait to your User model:

```php
// app/Models/User.php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use LaravelWebauthn\Models\WebauthnAuthenticatable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable, WebauthnAuthenticatable;
    
    // ... rest of your User model
}
```

### Step 4: Add Routes

Add WebAuthn routes to `routes/web.php`:

```php
use LaravelWebauthn\Http\Controllers\WebauthnController;

// Authenticated routes (for registration)
Route::middleware(['web', 'auth'])->group(function () {
    Route::post('/webauthn/register/options', [WebauthnController::class, 'registerOptions'])
        ->name('webauthn.register.options');
    Route::post('/webauthn/register', [WebauthnController::class, 'register'])
        ->name('webauthn.register');
    Route::get('/webauthn/keys', [WebauthnController::class, 'index'])
        ->name('webauthn.index');
    Route::delete('/webauthn/{id}', [WebauthnController::class, 'destroy'])
        ->name('webauthn.destroy');
});

// Guest routes (for login)
Route::middleware(['web', 'guest'])->group(function () {
    Route::post('/webauthn/login/options', [WebauthnController::class, 'loginOptions'])
        ->name('webauthn.login.options');
    Route::post('/webauthn/login', [WebauthnController::class, 'login'])
        ->name('webauthn.login');
});
```

### Step 5: Add Settings Page Route

Add a route for the passkey management page:

```php
use Inertia\Inertia;

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/settings/passkeys', function () {
        return Inertia::render('settings/passkeys', [
            'credentials' => auth()->user()->webauthnKeys()->get()
        ]);
    })->name('settings.passkeys');
});
```

### Step 6: Configure Environment

Update your `.env` file (HTTPS is required for WebAuthn):

```env
APP_URL=https://office.joshgen.org
WEBAUTHN_RP_ID=office.joshgen.org
WEBAUTHN_RP_NAME="JoshGen Office"
```

For local development, use:

```env
APP_URL=https://localhost
WEBAUTHN_RP_ID=localhost
```

### Step 7: Configure CORS (if needed)

If your frontend and backend are on different domains, update `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie', 'webauthn/*'],
```

## Testing

### Local Development

1. **HTTPS Required**: WebAuthn only works over HTTPS
   - Use Laravel Valet: `valet secure office-joshgen`
   - Or use Herd (automatically uses HTTPS)

2. **Test on Different Devices**:
   - macOS: Safari/Chrome with Touch ID
   - iOS: Safari with Face ID/Touch ID
   - Windows: Edge/Chrome with Windows Hello
   - Android: Chrome with fingerprint/face unlock

### Production Testing

1. Deploy to production server
2. Ensure SSL certificate is valid
3. Test registration flow:
   - Login with password
   - Navigate to `/settings/passkeys`
   - Click "Register Passkey"
   - Complete biometric prompt
4. Test login flow:
   - Logout
   - Visit login page
   - Click "Sign in with Passkey"
   - Complete biometric prompt

## Browser Support

| Browser | Platform | Status |
|---------|----------|--------|
| Safari 16+ | macOS/iOS | ✅ Full support |
| Chrome 67+ | All platforms | ✅ Full support |
| Edge 18+ | Windows | ✅ Full support |
| Firefox 60+ | All platforms | ✅ Full support |

## Security Considerations

1. **HTTPS Only**: WebAuthn requires HTTPS in production
2. **Relying Party ID**: Must match your domain
3. **User Verification**: Enforced by default (biometric/PIN required)
4. **Attestation**: Set to "none" for privacy (can be changed)
5. **Credential Storage**: Stored securely in device's authenticator

## User Experience

### Registration Flow
1. User logs in with password
2. Navigates to Settings → Passkeys
3. Clicks "Register Passkey"
4. System prompts for Face ID/Touch ID/PIN
5. Device name is saved (optional)
6. Passkey is registered and ready to use

### Login Flow
1. User visits login page
2. If passkey is available, "Sign in with Passkey" button appears
3. User clicks button
4. System prompts for Face ID/Touch ID/PIN
5. User is authenticated and redirected to dashboard

## Troubleshooting

### "Passkeys not supported"
- Browser doesn't support WebAuthn
- Device doesn't have biometric authenticator
- HTTPS not enabled

### "Failed to register passkey"
- User cancelled the biometric prompt
- Passkey already registered for this user
- Server configuration issue

### "Failed to authenticate with passkey"
- User cancelled the biometric prompt
- Passkey doesn't exist on this device
- Server configuration issue
- Domain mismatch (RP ID doesn't match)

## Additional Features (Future)

- [ ] Passkey sync across devices (Apple Keychain)
- [ ] Security key support (YubiKey, etc.)
- [ ] Conditional UI for autofill
- [ ] Device attestation verification
- [ ] Usage analytics and reporting

## Resources

- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [Laravel WebAuthn Package](https://github.com/asbiin/laravel-webauthn)
- [Apple Passkeys Documentation](https://developer.apple.com/passkeys/)
- [MDN WebAuthn Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check Laravel logs for server errors
4. Verify HTTPS and domain configuration
