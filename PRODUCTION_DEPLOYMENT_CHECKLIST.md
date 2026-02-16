# Production Deployment Checklist

Use this checklist every time you deploy to production to ensure nothing is missed.

## Pre-Deployment

- [ ] All code changes committed and pushed to repository
- [ ] Code reviewed and tested locally
- [ ] Database backup created (if applicable)
- [ ] Production environment variables documented
- [ ] Downtime window scheduled (if needed)

## Deployment Steps

### 1. Connect to Production Server
```bash
ssh officeftp@165.22.118.253
cd /home/1197962.cloudwaysapps.com/hczbsjjmgr/public_html
```

- [ ] SSH connection successful
- [ ] Navigated to correct directory

### 2. Update Code
```bash
# Upload files via SFTP or git pull
# Verify file permissions after upload
```

- [ ] Code files updated
- [ ] File permissions correct (644 for files, 755 for directories)

### 3. Install/Update Dependencies
```bash
composer install --no-dev --optimize-autoloader
```

- [ ] Composer dependencies installed
- [ ] No error messages about missing packages
- [ ] `vendor/` directory populated

### 4. Configure Environment
Edit `.env` and verify these critical settings:

- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `WEBAUTHN_USERLESS=true`
- [ ] Database credentials correct
- [ ] `APP_URL` matches production URL (https://office.joshgen.org)

### 5. Clear Config Cache (CRITICAL)
```bash
# MUST clear config cache after .env changes
rm -f bootstrap/cache/config.php
php artisan config:clear
php artisan config:cache
```

- [ ] Config cache file removed
- [ ] Config cleared
- [ ] Config cached successfully
- [ ] No error messages

### 6. Run Database Migrations
```bash
php artisan migrate --force
```

- [ ] Migrations completed successfully
- [ ] No migration errors
- [ ] Database tables created/updated

### 7. Build Frontend Assets
```bash
# Use direct path due to npm cache permission issues
./node_modules/.bin/vite build
```

- [ ] Vite build completed successfully
- [ ] `public/build/manifest.json` exists
- [ ] Assets generated in `public/build/` directory
- [ ] Check file timestamps to ensure fresh build

### 8. Clear Laravel Caches
```bash
php artisan route:clear
php artisan view:clear
php artisan cache:clear  # Optional, if using Laravel cache
```

- [ ] Route cache cleared
- [ ] View cache cleared
- [ ] Application cache cleared (if applicable)

## Post-Deployment Verification

### 9. Verify Configuration
```bash
php artisan config:show webauthn.userless
# Should output: true

php artisan config:show app.env
# Should output: "production"

php artisan config:show app.debug
# Should output: false
```

- [ ] `webauthn.userless` is `true`
- [ ] `app.env` is `production`
- [ ] `app.debug` is `false`

### 10. Test Application in Browser

Visit: https://office.joshgen.org

- [ ] Home page loads without errors
- [ ] CSS and JavaScript files loading correctly (no 404s in browser console)
- [ ] No console errors related to missing assets
- [ ] Application UI displays correctly

### 11. Test Authentication

#### Standard Login
- [ ] Login page loads
- [ ] Can login with email/password
- [ ] Redirects to dashboard after login

#### Passkey Login
- [ ] "Login with Passkey" button visible
- [ ] Click passkey button triggers browser prompt
- [ ] Passkey authentication successful
- [ ] Redirects to dashboard after passkey login

### 12. Test Passkey Registration

Login with existing account and navigate to `/settings/passkeys`:

- [ ] Settings page loads without 500 error
- [ ] "Register New Passkey" button visible
- [ ] Click register triggers browser prompt
- [ ] Passkey registration successful
- [ ] New passkey appears in list

### 13. Test Complete Workflow
- [ ] Logout from account
- [ ] Login with newly registered passkey
- [ ] Access protected pages
- [ ] All functionality works as expected

## Common Issues & Solutions

### Issue: "Authentication failed" on passkey login

**Check:**
- [ ] `WEBAUTHN_USERLESS=true` in `.env`
- [ ] Config cache cleared: `rm -f bootstrap/cache/config.php && php artisan config:clear && php artisan config:cache`
- [ ] Verify: `php artisan config:show webauthn.userless` returns `true`

### Issue: CSS/JS not loading (404 errors)

**Check:**
- [ ] `APP_ENV=production` in `.env`
- [ ] Vite build completed: `./node_modules/.bin/vite build`
- [ ] `public/build/manifest.json` exists and is recent
- [ ] Clear Laravel caches

### Issue: 500 error on /settings/passkeys

**Check:**
- [ ] Migrations run: `php artisan migrate --force`
- [ ] `webauthn_keys` table exists in database
- [ ] Check Laravel logs: `tail -f storage/logs/laravel.log`

### Issue: "Class 'Cose\Algorithms' not found"

**Fix:**
- [ ] Run: `composer install --no-dev --optimize-autoloader`
- [ ] Verify `vendor/` directory has all packages

### Issue: Route duplication error

**Check:**
- [ ] `Webauthn::ignoreRoutes()` called in `AppServiceProvider::register()` method (not `boot()`)
- [ ] Clear route cache: `php artisan route:clear && php artisan route:cache`

## Rollback Plan (If Needed)

If deployment fails:

1. [ ] Restore previous code version
2. [ ] Restore database backup (if migrations were run)
3. [ ] Clear all caches
4. [ ] Rebuild frontend assets from previous code
5. [ ] Verify application is functional
6. [ ] Document what went wrong for future reference

## Post-Deployment

- [ ] Monitor application logs for errors
- [ ] Inform team that deployment is complete
- [ ] Document any issues encountered and how they were resolved
- [ ] Update this checklist if new steps or issues discovered

---

**Last Updated:** 2026-02-16

**Critical Reminder:** Always clear config cache AFTER changing `.env` files. This is the most common cause of deployment issues with WebAuthn.
