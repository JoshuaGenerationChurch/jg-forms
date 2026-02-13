# Production Connection Checklist

Use this when you are SSH'd into the production server at this project root.

## 1. Prepare environment variables

1. Create production env file:

```bash
cp .env.production.example .env
```

2. Edit `.env` and set real values for:
- `APP_URL`
- `DB_*` credentials
- `SESSION_DOMAIN`
- `MAIL_*` credentials
- `JG_API_BASE_URL`
- `JG_API_TOKEN`
- `WORK_FORMS_ADMIN_EMAILS`

## 2. Install dependencies and build

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
```

If Node is not available on the server, build assets in CI/local and deploy `public/build`.

## 3. Initialize Laravel for production

```bash
php artisan key:generate --force
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 4. Verify app health

```bash
php artisan about
php artisan route:list --path=work-request
```

Then open the site and verify login/session + form submission flow.

## 5. Background jobs

If queues are used in production, ensure a worker is running and restart it on deploy:

```bash
php artisan queue:restart
```

Use Supervisor/systemd to keep workers alive.
