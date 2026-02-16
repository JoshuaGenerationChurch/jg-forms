# Passkey (WebAuthn) Setup Guide

This guide explains how to set up and use passkey authentication in the JoshGen Office application.

## Table of Contents

- [What are Passkeys?](#what-are-passkeys)
- [Quick Setup](#quick-setup)
- [Manual Setup](#manual-setup)
- [Architecture Overview](#architecture-overview)
- [File Structure](#file-structure)
- [Troubleshooting](#troubleshooting)
- [Testing](#testing)

## What are Passkeys?

Passkeys (WebAuthn) provide a secure, passwordless authentication method using:
- **Face ID** or **Touch ID** on macOS/iOS
- **Windows Hello** on Windows
- **Biometric sensors** on Android devices
- **Security keys** (like YubiKey)

Benefits:
- More secure than passwords (phishing-resistant)
- Faster login experience
- No password to remember or manage
- Industry standard (FIDO2/WebAuthn)

## Quick Setup

For developers setting up the project for the first time:

```bash
cd jg-forms
./scripts/setup-passkeys.sh
```

This script will:
1. Install the Laravel WebAuthn package
2. Publish configuration files
3. Run database migrations
4. Verify all files and routes are in place
5. Build frontend assets
6. Configure HTTPS (required for WebAuthn)

## Manual Setup

If you prefer to set up manually or need to understand the components:

### 1. Install Laravel WebAuthn Package

```bash
composer require asbiin/laravel-webauthn:^5.4
```

### 2. Publish Configuration

```bash
php artisan vendor:publish --provider="LaravelWebauthn\WebauthnServiceProvider" --tag="config"
```

This creates `config/webauthn.php` with default settings.

### 3. Run Database Migration

The migration creates the `webauthn_keys` table to store user credentials.

```bash
# Copy migration from vendor if not already present
cp vendor/asbiin/laravel-webauthn/database/migrations/*_add_webauthn.php database/migrations/

# Run migration
php artisan migrate
```

### 4. Update User Model

Add the `WebauthnAuthenticatable` trait to your `User` model:

```php
// app/Models/User.php

use LaravelWebauthn\WebauthnAuthenticatable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable, WebauthnAuthenticatable;
    
    // ... rest of the model
}
```

### 5. Configure Routes

Routes are already configured in `routes/web.php`. They include:

**Guest Routes (for login):**
```php
Route::middleware(['web', 'guest'])->group(function () {
    Route::post('/webauthn/login/options', [AuthenticateController::class, 'create'])
        ->name('webauthn.login.options');
    Route::post('/webauthn/login', [AuthenticateController::class, 'store'])
        ->name('webauthn.login');
});
```

**Authenticated Routes (for registration/management):**
```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/webauthn/register/options', [WebauthnKeyController::class, 'create'])
        ->name('webauthn.register.options');
    Route::post('/webauthn/register', [WebauthnKeyController::class, 'store'])
        ->name('webauthn.register');
    Route::delete('/webauthn/{id}', [WebauthnKeyController::class, 'destroy'])
        ->name('webauthn.destroy');
    
    Route::get('/settings/passkeys', function () {
        return Inertia::render('settings/passkeys', [
            'credentials' => auth()->user()->webauthnKeys()->get()
        ]);
    })->name('settings.passkeys');
});
```

### 6. Build Frontend Assets

```bash
npm install
npm run build
```

### 7. Configure HTTPS (Required)

WebAuthn requires HTTPS in production and for local development (except localhost).

**Using Laravel Herd:**
```bash
herd secure office-joshgen
```

**Manual SSL Setup:**
- Use `valet secure` if using Laravel Valet
- Configure your local web server with SSL certificates
- Ensure the browser trusts the certificate

## Architecture Overview

### Backend Components

1. **Package**: `asbiin/laravel-webauthn` (v5.4+)
   - Handles WebAuthn server-side logic
   - Provides controllers for registration and authentication
   - Manages credential storage

2. **Database Table**: `webauthn_keys`
   - Stores user credentials (public keys)
   - Tracks usage and metadata
   - One-to-many relationship with users

3. **Controllers**:
   - `LaravelWebauthn\Http\Controllers\WebauthnKeyController` - Registration
   - `LaravelWebauthn\Http\Controllers\AuthenticateController` - Login

4. **User Model Trait**: `WebauthnAuthenticatable`
   - Adds `webauthnKeys()` relationship
   - Enables WebAuthn functionality on the User model

### Frontend Components

1. **Pages**:
   - `resources/js/pages/settings/passkeys.tsx` - Management interface
   - `resources/js/pages/auth/login.tsx` - Login with passkey button

2. **Components**:
   - `resources/js/components/passkey-registration.tsx` - Registration flow

3. **Libraries**:
   - `resources/js/lib/webauthn.ts` - WebAuthn API helpers
   - `resources/js/lib/webauthn-api.ts` - Backend API endpoints

4. **Types**:
   - `resources/js/types/webauthn.ts` - TypeScript definitions

### Authentication Flow

**Registration:**
```
User → Click "Add Passkey" 
     → Frontend requests options from /webauthn/register/options
     → Browser shows biometric prompt
     → Frontend sends credential to /webauthn/register
     → Backend stores public key in database
     → Success!
```

**Login:**
```
User → Click "Sign in with Passkey"
     → Frontend requests challenge from /webauthn/login/options
     → Browser shows biometric prompt
     → Frontend sends assertion to /webauthn/login
     → Backend verifies signature
     → User logged in!
```

## File Structure

```
jg-forms/
├── app/
│   └── Models/
│       └── User.php                                    # Has WebauthnAuthenticatable trait
├── config/
│   └── webauthn.php                                    # WebAuthn configuration
├── database/
│   └── migrations/
│       └── *_add_webauthn.php                          # Creates webauthn_keys table
├── routes/
│   └── web.php                                         # WebAuthn routes
├── resources/
│   └── js/
│       ├── pages/
│       │   ├── auth/
│       │   │   └── login.tsx                           # Login page with passkey button
│       │   └── settings/
│       │       └── passkeys.tsx                        # Passkey management page
│       ├── components/
│       │   └── passkey-registration.tsx                # Registration component
│       ├── lib/
│       │   ├── webauthn.ts                             # WebAuthn helpers
│       │   └── webauthn-api.ts                         # API endpoints
│       ├── types/
│       │   └── webauthn.ts                             # TypeScript types
│       └── layouts/
│           └── settings/
│               └── layout.tsx                          # Settings nav (includes Passkeys link)
├── scripts/
│   └── setup-passkeys.sh                               # Automated setup script
└── PASSKEY_SETUP.md                                    # This file
```

## Troubleshooting

### Certificate Errors

**Problem**: "WebAuthn is not supported on sites with TLS certificate errors"

**Solution**:
1. Ensure HTTPS is configured: `herd secure office-joshgen`
2. Restart your browser completely (not just refresh)
3. Check for green padlock in address bar
4. If still showing as insecure:
   - macOS: Open Keychain Access → System → Find "Laravel Valet CA" → Double-click → Trust → "Always Trust"
   - Restart browser again

### Server Returns HTML Instead of JSON

**Problem**: Getting HTML response from `/webauthn/register/options`

**Solution**: Ensure the request includes the `Accept: application/json` header. This is already configured in the frontend components.

### Migration Already Exists Error

**Problem**: Migration fails because table already exists

**Solution**:
```bash
# Check migration status
php artisan migrate:status

# If already run, skip it
# If table doesn't exist but migration shows as run:
php artisan migrate:rollback --step=1
php artisan migrate
```

### Passkeys Not Showing in Settings

**Problem**: Passkeys link missing from settings sidebar

**Solution**: Ensure the settings layout includes the import and navigation item:

```typescript
// resources/js/layouts/settings/layout.tsx
import { passkeys } from '@/routes/settings';

const sidebarNavItems: NavItem[] = [
    // ... other items
    {
        title: 'Passkeys',
        href: passkeys.url(),
        icon: null,
    },
];
```

Then rebuild: `npm run build`

### Browser Doesn't Support WebAuthn

**Problem**: "Passkeys not supported" message appears

**Solution**:
- Use a modern browser (Chrome 67+, Firefox 60+, Safari 13+, Edge 18+)
- Ensure HTTPS is enabled
- Check if your device has biometric authentication enabled
- Try a different browser

### CSRF Token Mismatch (419 Error)

**Problem**: Getting 419 error when registering passkeys

**Solution**: The components already include CSRF token handling via the `X-XSRF-TOKEN` header. If you still see this:
1. Clear browser cookies
2. Refresh the page
3. Try again

## Testing

### Testing Registration

1. Navigate to https://office-joshgen.test/settings/passkeys
2. Click "Register Passkey"
3. Follow the biometric prompt
4. Verify the passkey appears in the "Your Passkeys" list

### Testing Login

1. Log out of the application
2. Go to https://office-joshgen.test/login
3. Click "Sign in with Passkey" button
4. Follow the biometric prompt
5. Verify you're logged in successfully

### Testing Deletion

1. Go to settings/passkeys
2. Click the trash icon next to a passkey
3. Confirm deletion
4. Verify the passkey is removed from the list

### Testing Multiple Devices

1. Register a passkey on your computer
2. Register another passkey on your phone (same account)
3. Try logging in from both devices
4. Verify both passkeys work independently

## Production Deployment

When deploying to production:

1. Ensure SSL certificate is valid and trusted
2. Run migrations on production database
3. Build and deploy frontend assets
4. Configure `config/webauthn.php` if needed (defaults should work)
5. Test registration and login thoroughly

Production checklist:
- [ ] SSL certificate installed and valid
- [ ] `composer require asbiin/laravel-webauthn:^5.4` on production
- [ ] Migrations run: `php artisan migrate`
- [ ] Frontend assets built and deployed
- [ ] Routes verified in `routes/web.php`
- [ ] User model has `WebauthnAuthenticatable` trait
- [ ] Test registration works
- [ ] Test login works
- [ ] Test deletion works

## Additional Resources

- [WebAuthn Guide](https://webauthn.guide/) - Interactive WebAuthn tutorial
- [Laravel WebAuthn Package](https://github.com/asbiin/laravel-webauthn) - Official package documentation
- [FIDO Alliance](https://fidoalliance.org/) - WebAuthn/FIDO2 standards
- [Can I Use WebAuthn](https://caniuse.com/webauthn) - Browser compatibility

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for JavaScript errors
2. Check Laravel logs: `storage/logs/laravel.log`
3. Verify all files exist as documented
4. Try the automated setup script: `./scripts/setup-passkeys.sh`
5. Consult the package documentation: https://github.com/asbiin/laravel-webauthn

---

**Last Updated**: February 2026
**Package Version**: asbiin/laravel-webauthn v5.4+
**Laravel Version**: 12.x
**Frontend**: React 19 + Inertia.js + TypeScript
