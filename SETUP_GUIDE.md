# JoshGen Office - Complete Setup Guide

Complete guide for setting up the JoshGen Office application with WebAuthn/Passkey support for local development and production deployment.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Automated Setup](#automated-setup)
- [Manual Setup](#manual-setup)
- [WebAuthn/Passkey Configuration](#webauthpasskey-configuration)
- [Verification Checklist](#verification-checklist)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

## Quick Start

For the fastest setup, run the automated script:

```bash
cd jg-forms
chmod +x setup-local.sh
./setup-local.sh
```

This script handles all setup steps including WebAuthn/Passkey configuration.

## Prerequisites

Ensure you have these installed:

- **PHP 8.2+** - Check with `php -v`
- **Composer** - PHP dependency manager
- **Node.js 18+** - Check with `node -v`
- **npm** - Comes with Node.js
- **MySQL or PostgreSQL** - Database server
- **Git** - Version control
- **Laravel Herd** (recommended) - Provides automatic HTTPS for WebAuthn support

## Automated Setup

### 1. Run the Setup Script

```bash
./setup-local.sh
```

The script will:
1. Verify all prerequisites are installed
2. Install PHP and JavaScript dependencies
3. Create and configure `.env` file
4. Generate application key
5. Run database migrations
6. Configure WebAuthn/Passkey support
7. Build frontend assets
8. Set up HTTPS (if using Herd)

### 2. Configure Environment

After running the script, update your `.env` file:

```env
APP_NAME="JoshGen Office"
APP_ENV=local
APP_DEBUG=true
APP_URL=https://office-joshgen.test

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=joshgen_office
DB_USERNAME=root
DB_PASSWORD=

# WebAuthn/Passkey Configuration
WEBAUTHN_USERLESS=true
```

### 3. Clear Configuration Cache

```bash
php artisan config:clear
php artisan config:cache
```

### 4. Start Development

If using **Laravel Herd**:
- Visit `https://office-joshgen.test` in your browser

If using **other methods**:
```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Frontend dev server
npm run dev
```

## Manual Setup

If you prefer step-by-step manual setup:

### Step 1: Clone and Install

```bash
git clone <repository-url>
cd office-joshgen/jg-forms
composer install
npm install
```

### Step 2: Environment Setup

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` with your database credentials and ensure `WEBAUTHN_USERLESS=true`.

### Step 3: Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE joshgen_office;
EXIT;

# Run migrations
php artisan migrate
```

### Step 4: WebAuthn Package Setup

```bash
# Install package
composer require asbiin/laravel-webauthn

# Publish configuration
php artisan vendor:publish --provider="LaravelWebauthn\ServiceProvider"

# Run migrations
php artisan migrate
```

### Step 5: Configure AppServiceProvider

The `app/Providers/AppServiceProvider.php` already includes the necessary WebAuthn configuration:

```php
protected function configureWebauthn(): void
{
    Webauthn::authenticateUsing(function ($request) {
        if (config('webauthn.userless')) {
            $userHandle = $request->input('response.userHandle');
            
            if ($userHandle) {
                $userId = base64_decode(strtr($userHandle, '-_', '+/'));
                return User::find($userId);
            }
        }
        
        return null;
    });
}
```

This callback enables passwordless login by finding users from their passkey credentials.

### Step 6: Build Assets

```bash
npm run build
```

### Step 7: Configure HTTPS

Using **Laravel Herd**:
```bash
herd secure office-joshgen
```

Using **Valet**:
```bash
valet link office-joshgen
valet secure office-joshgen
```

## WebAuthn/Passkey Configuration

### What are Passkeys?

Passkeys provide passwordless authentication using:
- Face ID / Touch ID (macOS/iOS)
- Windows Hello (Windows)
- Fingerprint sensors (Android)
- Hardware security keys (YubiKey, etc.)

### Key Components

#### Backend Files

1. **AppServiceProvider** (`app/Providers/AppServiceProvider.php`)
   - Configures `Webauthn::authenticateUsing()` callback
   - Enables userless authentication

2. **Configuration** (`config/webauthn.php`)
   - Published from package
   - Configure RP ID, name, and other settings

3. **Database** (`webauthn_keys` table)
   - Stores user passkey credentials
   - Created by migration

4. **Routes** (`routes/web.php`)
   - Already configured for guest and authenticated routes

#### Frontend Files

1. **Login Page** (`resources/js/pages/auth/login.tsx`)
   - Shows "Sign in with Passkey" button on supported devices

2. **Passkey Management** (`resources/js/pages/settings/passkeys.tsx`)
   - Register and manage passkeys
   - View all registered devices

3. **WebAuthn Utilities** (`resources/js/lib/webauthn.ts`)
   - Core WebAuthn API helpers
   - Base64url encoding/decoding

4. **API Configuration** (`resources/js/lib/webauthn-api.ts`)
   - Backend endpoint definitions

### Authentication Flow

**Registration**:
1. User logs in with password
2. Navigates to Settings > Passkeys
3. Clicks "Register Passkey"
4. Browser prompts for biometric authentication
5. Passkey is stored and ready to use

**Login**:
1. User visits login page
2. Clicks "Sign in with Passkey"
3. Browser prompts for biometric authentication
4. User is authenticated and logged in

## Verification Checklist

### Backend Verification

- [ ] Package installed: `composer show asbiin/laravel-webauthn`
- [ ] Config file exists: `config/webauthn.php`
- [ ] Table exists: `php artisan tinker` → `Schema::hasTable('webauthn_keys')`
- [ ] User model has trait: Check `app/Models/User.php` for `WebauthnAuthenticatable`
- [ ] AppServiceProvider configured: Check `configureWebauthn()` method exists
- [ ] Routes registered: `php artisan route:list | grep webauthn`

### Frontend Verification

- [ ] Files exist:
  - `resources/js/pages/settings/passkeys.tsx`
  - `resources/js/components/passkey-registration.tsx`
  - `resources/js/lib/webauthn.ts`
  - `resources/js/lib/webauthn-api.ts`
- [ ] Assets built: `public/build/manifest.json` exists
- [ ] No console errors in browser DevTools

### HTTPS Verification

- [ ] Site accessible via HTTPS
- [ ] Green padlock shows in browser
- [ ] Certificate trusted (check Keychain Access on macOS)
- [ ] `APP_URL` in `.env` uses HTTPS

### Feature Testing

- [ ] Visit `/settings/passkeys` (after login)
- [ ] Click "Register Passkey" - biometric prompt appears
- [ ] Passkey appears in list after registration
- [ ] Log out and click "Sign in with Passkey" on login page
- [ ] Successfully login with passkey
- [ ] Can delete passkeys from management page

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing: `php artisan test`
- [ ] Frontend assets built: `npm run build`
- [ ] SSL certificate installed and valid
- [ ] Environment variables configured on production server
- [ ] `WEBAUTHN_USERLESS=true` added to production `.env`

### Deployment Steps

#### 1. SSH into Production Server
```bash
ssh officeftp@165.22.118.253
cd /home/1197962.cloudwaysapps.com/hczbsjjmgr/public_html
```

#### 2. Update Code
```bash
# Pull latest code (or upload files if not using git)
git pull origin main
```

#### 3. Install Dependencies
```bash
composer install --no-dev --optimize-autoloader
npm install --production
```

#### 4. Configure Environment

**CRITICAL:** Ensure `.env` has these settings:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://office.joshgen.org
WEBAUTHN_USERLESS=true
```

Verify the setting:
```bash
grep WEBAUTHN_USERLESS .env
```

If missing, add it:
```bash
echo "WEBAUTHN_USERLESS=true" >> .env
```

#### 5. Run Database Migrations
```bash
php artisan migrate --force
```

This creates the `webauthn_keys` table.

#### 6. Build Frontend Assets
```bash
./node_modules/.bin/vite build
```

**Note:** This must be done AFTER code updates to include latest changes.

#### 7. Clear and Rebuild Caches

**IMPORTANT:** This step is critical. Must be done in this exact order:

```bash
# First: Remove old cached config
rm -f bootstrap/cache/config.php
rm -f bootstrap/cache/routes*.php

# Second: Clear all caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Third: Rebuild caches for production
php artisan config:cache
php artisan route:cache

# Fourth: Verify config is loaded correctly
php artisan config:show webauthn.userless
```

**Expected output:** `true`

If it shows `false`, repeat step 7.

#### 8. Verify Installation

Check that routes are registered:
```bash
php artisan route:list | grep webauthn
```

Expected output (5 routes):
```
POST   webauthn/login
POST   webauthn/login/options
POST   webauthn/register
POST   webauthn/register/options
DELETE webauthn/{id}
```

#### 9. Test on Production

1. **Visit:** https://office.joshgen.org/login
2. **Check:** "Sign in with Passkey" button appears
3. **Login** with password first
4. **Go to:** https://office.joshgen.org/settings/passkeys
5. **Register** a new passkey
6. **Logout** and test login with passkey

### Common Production Issues

#### Issue: Config cache not updating

**Symptoms:**
- Routes work but passkey login fails with "Authentication failed"
- `config:show webauthn.userless` shows `false`

**Solution:**
```bash
rm -f bootstrap/cache/config.php
php artisan config:clear
php artisan config:cache
php artisan config:show webauthn.userless  # Should show: true
```

#### Issue: Routes not found (404)

**Symptoms:**
- `/webauthn/login/options` returns 404

**Solution:**
```bash
php artisan route:clear
php artisan route:cache
php artisan route:list | grep webauthn
```

#### Issue: Old JavaScript cached

**Symptoms:**
- Button doesn't appear or makes wrong API calls
- Assets have old timestamps

**Solution:**
```bash
./node_modules/.bin/vite build
# Clear browser cache (Ctrl+Shift+Delete)
```

#### Issue: 500 error on `/settings/passkeys`

**Symptoms:**
- Can login but settings page crashes

**Solution:**
```bash
php artisan migrate --force  # Ensure webauthn_keys table exists
php artisan config:clear
php artisan config:cache
```

### Production Deployment Checklist

After deployment, verify each item:

- [ ] Code updated on server
- [ ] Dependencies installed (`composer install`, `npm install`)
- [ ] `.env` has `WEBAUTHN_USERLESS=true`
- [ ] Config cache cleared and rebuilt
- [ ] `php artisan config:show webauthn.userless` returns `true`
- [ ] Route cache cleared and rebuilt
- [ ] `php artisan route:list | grep webauthn` shows 5 routes
- [ ] Database migrations run
- [ ] Frontend assets built with Vite
- [ ] Login page shows "Sign in with Passkey" button
- [ ] Can register new passkey at `/settings/passkeys`
- [ ] Can login with passkey successfully
- [ ] No errors in `storage/logs/laravel.log`

## Troubleshooting

### "Passkeys not supported"

**Cause**: Missing HTTPS or browser doesn't support WebAuthn

**Solution**:
- Ensure site is accessed via HTTPS
- Use modern browser (Chrome 67+, Firefox 60+, Safari 13+, Edge 18+)
- Check device has biometric authenticator

### "Authentication failed" (422 error)

**Cause**: `Webauthn::authenticateUsing()` callback not configured

**Solution**:
- Verify `AppServiceProvider::configureWebauthn()` exists
- Check `WEBAUTHN_USERLESS=true` in `.env`
- Clear config cache: `php artisan config:clear && php artisan config:cache`

### Frontend Assets Not Loading

**Solution**:
```bash
npm run build
php artisan view:clear
```

### Config Changes Not Taking Effect

**Solution**:
```bash
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan view:clear
```

### Certificate Trust Issues (macOS)

**Solution**:
1. Open Keychain Access
2. Search for "Laravel Valet CA" or "Laravel Herd CA"
3. Double-click certificate
4. Expand "Trust" section
5. Set "When using this certificate" to "Always Trust"
6. Restart browser

## Project Structure

```
jg-forms/
├── app/
│   ├── Models/
│   │   └── User.php                    # Has WebauthnAuthenticatable trait
│   └── Providers/
│       └── AppServiceProvider.php       # WebAuthn configuration
├── config/
│   └── webauthn.php                    # WebAuthn package config
├── database/
│   └── migrations/
│       └── *_add_webauthn.php          # Creates webauthn_keys table
├── resources/
│   └── js/
│       ├── pages/
│       │   ├── auth/
│       │   │   └── login.tsx           # Passkey login button
│       │   └── settings/
│       │       └── passkeys.tsx        # Passkey management
│       ├── components/
│       │   └── passkey-registration.tsx
│       └── lib/
│           ├── webauthn.ts             # WebAuthn helpers
│           └── webauthn-api.ts         # API endpoints
├── routes/
│   └── web.php                         # WebAuthn routes
├── SETUP_GUIDE.md                      # This file
└── setup-local.sh                      # Automated setup script
```

## Additional Resources

- [WebAuthn Guide](https://webauthn.guide/) - Interactive tutorial
- [Laravel WebAuthn Package](https://github.com/asbiin/laravel-webauthn) - Package docs
- [FIDO Alliance](https://fidoalliance.org/) - WebAuthn/FIDO2 standards
- [Laravel Documentation](https://laravel.com/docs)
- [Inertia.js Documentation](https://inertiajs.com)

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Check Laravel logs: `storage/logs/laravel.log`
3. Check browser console for JavaScript errors
4. Run the setup script again: `./setup-local.sh`
5. Contact the development team

---

**Last Updated**: February 2026  
**Laravel**: 12.x  
**WebAuthn Package**: asbiin/laravel-webauthn v5.4+  
**Frontend**: React 19 + Inertia.js + TypeScript
