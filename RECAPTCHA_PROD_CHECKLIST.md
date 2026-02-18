# reCAPTCHA Production Checklist

Use this checklist when setting up or debugging reCAPTCHA Enterprise on production.

## 1. Required Production `.env` Values

```env
RECAPTCHA_ENABLED=true
RECAPTCHA_SITE_KEY=your_site_key
VITE_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_PROJECT_ID=your_gcp_project_id
RECAPTCHA_EXPECTED_ACTION=work_request_submit
RECAPTCHA_MIN_SCORE=0.5
GOOGLE_APPLICATION_CREDENTIALS=/home/master/secrets/jgforms-recaptcha.json
```

## 2. Credentials File

Store service account JSON on the server:

```bash
mkdir -p /home/master/secrets
chmod 750 /home/master/secrets
```

Ensure web runtime can read it:

```bash
chgrp www-data /home/master/secrets
chgrp www-data /home/master/secrets/jgforms-recaptcha.json
chmod 640 /home/master/secrets/jgforms-recaptcha.json
```

## 3. Deploy + Build

```bash
git pull origin main
composer install --no-dev --optimize-autoloader
npm install
npm run build
php artisan optimize:clear
php artisan config:cache
```

## 4. Runtime Verification

Check config is loaded:

```bash
php artisan tinker --execute="dump(config('services.recaptcha'));"
```

Run health check:

```bash
php artisan recaptcha:health-check
```

Expected: reports enabled/configured and `Google access token available: yes`.

## 5. Functional Check

1. Submit a real request on `/work-request`.
2. Submit a real request on:
   - `/forms/easter-holidays`
   - `/forms/christmas-holidays`
3. Open Google Cloud reCAPTCHA key logs and confirm action traffic appears.

## 6. If Submissions Fail

Check application logs:

```bash
tail -n 200 storage/logs/laravel.log | grep -i recaptcha
```

Common causes:
- credentials file unreadable by web runtime
- stale config cache
- frontend assets not rebuilt after env changes
- blocked outbound connectivity to Google OAuth/reCAPTCHA endpoints
