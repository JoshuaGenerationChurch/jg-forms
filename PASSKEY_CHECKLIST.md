# Passkey Setup Verification Checklist

Use this checklist to verify that passkey authentication is properly configured in your local development environment.

## Pre-Setup Checklist

Before running the setup script:

- [ ] Node.js and npm installed
- [ ] Composer installed
- [ ] Laravel Herd installed (or alternative local PHP server with HTTPS support)
- [ ] Modern browser (Chrome 67+, Firefox 60+, Safari 13+, Edge 18+)
- [ ] Device with biometric authentication (Touch ID, Face ID, Windows Hello, or fingerprint sensor)

## Automated Setup

Run the setup script:

```bash
cd jg-forms
./scripts/setup-passkeys.sh
```

## Manual Verification Checklist

### 1. Backend Package Installation

- [ ] Package installed: Run `composer show asbiin/laravel-webauthn`
  - Expected: Shows version 5.4.x or higher
  - If not: Run `composer require asbiin/laravel-webauthn:^5.4`

### 2. Configuration File

- [ ] Config file exists: Check `config/webauthn.php`
  - Expected: File exists with WebAuthn configuration
  - If not: Run `php artisan vendor:publish --provider="LaravelWebauthn\WebauthnServiceProvider" --tag="config"`

### 3. Database Migration

- [ ] Migration file exists: Check `database/migrations/*_add_webauthn.php`
  - Expected: Migration file present
  - If not: Copy from `vendor/asbiin/laravel-webauthn/database/migrations/`

- [ ] Table created: Run `php artisan migrate:status | grep webauthn`
  - Expected: Shows migration as "Ran"
  - If not: Run `php artisan migrate`

- [ ] Table structure: Run `php artisan tinker` then `Schema::hasTable('webauthn_keys')`
  - Expected: Returns `true`
  - Columns should include: `id`, `user_id`, `name`, `credentialId`, `type`, `transports`, `attestationType`, `trustPath`, `aaguid`, `credentialPublicKey`, `counter`, `created_at`, `updated_at`, `disabled_at`, `last_used_at`

### 4. User Model Configuration

- [ ] Open `app/Models/User.php` and verify:
  ```php
  use LaravelWebauthn\WebauthnAuthenticatable;
  
  class User extends Authenticatable
  {
      use HasFactory, Notifiable, TwoFactorAuthenticatable, WebauthnAuthenticatable;
  ```

- [ ] Test relationship: Run in `php artisan tinker`:
  ```php
  $user = User::first();
  $user->webauthnKeys;
  ```
  - Expected: Returns collection (empty or with passkeys)

### 5. Routes Configuration

- [ ] Open `routes/web.php` and verify these imports exist:
  ```php
  use LaravelWebauthn\Http\Controllers\AuthenticateController;
  use LaravelWebauthn\Http\Controllers\WebauthnKeyController;
  ```

- [ ] Verify guest routes exist:
  ```php
  Route::post('/webauthn/login/options', [AuthenticateController::class, 'create']);
  Route::post('/webauthn/login', [AuthenticateController::class, 'store']);
  ```

- [ ] Verify authenticated routes exist:
  ```php
  Route::post('/webauthn/register/options', [WebauthnKeyController::class, 'create']);
  Route::post('/webauthn/register', [WebauthnKeyController::class, 'store']);
  Route::delete('/webauthn/{id}', [WebauthnKeyController::class, 'destroy']);
  Route::get('/settings/passkeys', ...);
  ```

- [ ] Check routes registered: Run `php artisan route:list | grep webauthn`
  - Expected: Shows all WebAuthn routes

### 6. Frontend Files

Check that these files exist:

- [ ] `resources/js/pages/settings/passkeys.tsx` - Passkey management page
- [ ] `resources/js/components/passkey-registration.tsx` - Registration component
- [ ] `resources/js/lib/webauthn.ts` - WebAuthn helper functions
- [ ] `resources/js/lib/webauthn-api.ts` - API endpoint definitions
- [ ] `resources/js/types/webauthn.ts` - TypeScript type definitions
- [ ] `resources/js/pages/auth/login.tsx` - Should have passkey button
- [ ] `resources/js/layouts/settings/layout.tsx` - Should have Passkeys nav item

### 7. Frontend Build

- [ ] Dependencies installed: Run `npm list | grep date-fns`
  - Expected: Shows date-fns package
  - If not: Run `npm install`

- [ ] Assets built: Check `public/build/manifest.json`
  - Expected: File exists with recent timestamp
  - If not: Run `npm run build`

- [ ] Check for passkey-related assets: Run `ls public/build/assets/ | grep passkey`
  - Expected: Shows passkey-related JS files

### 8. HTTPS Configuration

- [ ] Site secured: Run `herd list` and check for padlock icon
  - Expected: Shows office-joshgen with HTTPS indicator
  - If not: Run `herd secure office-joshgen`

- [ ] Access site: Visit `https://office-joshgen.test`
  - Expected: Green padlock in browser address bar
  - If not: Restart browser and check certificate trust

- [ ] Certificate trusted:
  - macOS: Open Keychain Access → System → Search "Laravel Valet CA"
  - Expected: Certificate shows "This certificate is marked as trusted"
  - If not: Double-click certificate → Trust → "Always Trust"

### 9. Settings Navigation

- [ ] Visit `https://office-joshgen.test/settings`
- [ ] Check sidebar navigation
  - Expected: See "Passkeys" link between "Two-Factor Auth" and "Appearance"
  - If not: Rebuild frontend (`npm run build`)

### 10. Passkey Management Page

- [ ] Visit `https://office-joshgen.test/settings/passkeys`
- [ ] Page loads correctly
  - Expected: See page title "Passkeys", description, and two sections
- [ ] Check page layout:
  - [ ] Left section: "Add New Passkey" with registration form
  - [ ] Right section: "Your Passkeys" list (empty initially)
  - [ ] Bottom: "Security Tips" section
- [ ] No console errors in browser DevTools

### 11. Registration Flow

- [ ] Click "Register Passkey" button
- [ ] Browser shows biometric prompt
  - Expected: Face ID/Touch ID/Windows Hello prompt appears
- [ ] Complete biometric authentication
- [ ] Check for success message: "Passkey registered successfully!"
- [ ] Verify passkey appears in "Your Passkeys" list with:
  - [ ] Device name
  - [ ] "Added X ago" timestamp
  - [ ] Delete button (trash icon)

### 12. Login Flow

- [ ] Log out: Visit `https://office-joshgen.test/logout`
- [ ] Go to login page: `https://office-joshgen.test/login`
- [ ] Check for "Sign in with Passkey" button
  - Expected: Button with fingerprint icon appears
- [ ] Click "Sign in with Passkey"
- [ ] Browser shows biometric prompt
- [ ] Complete authentication
  - Expected: Successfully logged in and redirected to dashboard

### 13. Passkey Deletion

- [ ] Go to `https://office-joshgen.test/settings/passkeys`
- [ ] Click trash icon next to a passkey
- [ ] Confirm deletion dialog
  - Expected: Shows confirmation prompt
- [ ] Confirm deletion
  - Expected: Passkey removed from list

### 14. Browser Console Check

Open browser DevTools (F12) → Console tab:

- [ ] No JavaScript errors during page load
- [ ] Registration flow logs (if enabled):
  - "Options response status: 200"
  - "Options response headers: {...}"
  - "Raw response: {...publicKey...}"
- [ ] No CORS errors
- [ ] No 419 CSRF errors
- [ ] No certificate errors

### 15. Backend Logs Check

Check `storage/logs/laravel.log`:

- [ ] No errors related to WebAuthn
- [ ] No errors about missing `webauthn_keys` table
- [ ] No errors about missing `WebauthnAuthenticatable` trait

## Testing Different Scenarios

### Multiple Passkeys

- [ ] Register passkey on laptop
- [ ] Register passkey on phone (same account)
- [ ] Both appear in passkey list
- [ ] Can log in with either passkey
- [ ] Can delete individual passkeys

### Edge Cases

- [ ] Try registering without biometric setup on device
  - Expected: Error message about lack of support
- [ ] Try accessing `/settings/passkeys` while logged out
  - Expected: Redirect to login page
- [ ] Try API endpoints directly without CSRF token
  - Expected: 419 error or proper JSON error response

## Performance Checks

- [ ] Page loads quickly (< 2 seconds)
- [ ] Biometric prompt appears immediately when clicking button
- [ ] Registration completes within 5 seconds
- [ ] Login completes within 3 seconds
- [ ] No lag when loading passkey list

## Security Checks

- [ ] Passkeys are user-specific (can't see other users' passkeys)
- [ ] Can only delete own passkeys
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] CSRF protection active on all API endpoints
- [ ] No sensitive data exposed in browser console

## Final Verification

Run this command to verify all components:

```bash
# Check that everything is in place
php artisan tinker

# Then run:
User::first()->webauthnKeys()->count(); // Should work without error
Schema::hasTable('webauthn_keys'); // Should return true
config('webauthn.enable'); // Should return true
```

## Success Criteria

All items above should be checked (✓). If any item fails:

1. Refer to `PASSKEY_SETUP.md` for detailed setup instructions
2. Check the Troubleshooting section
3. Re-run `./scripts/setup-passkeys.sh`
4. Check Laravel logs and browser console for specific errors

---

**When all items are checked, passkey authentication is ready for use!**
