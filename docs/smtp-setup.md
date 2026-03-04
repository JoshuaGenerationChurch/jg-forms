# SMTP Setup And Verification

Use this checklist to enable outbound email for JG Forms and verify it safely.

## 1. Configure `.env`

Set these values in the target environment:

```env
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USERNAME=your-smtp-username
MAIL_PASSWORD=your-smtp-password
MAIL_FROM_ADDRESS=forms@your-domain.com
MAIL_FROM_NAME="JG Forms"
```

Optional but recommended:

```env
QUEUE_CONNECTION=database
```

## 2. Ensure default recipients are set

The app sends form notifications to recipients from:

```env
WORK_FORMS_NOTIFICATION_RECIPIENTS="name@example.com;\"Team\" <team@example.com>"
```

## 3. Run migrations

```bash
php artisan migrate --force
```

## 4. Run queue worker

Email notifications are queued. Ensure a queue worker is running:

```bash
php artisan queue:work --tries=1 --timeout=0
```

In production, run queue workers via Supervisor/systemd.

## 5. Validate mail config

Check config state:

```bash
php artisan mail:health-check
```

Send a real test email:

```bash
php artisan mail:health-check --send-to=you@example.com
```

Queue the test email instead of sending immediately:

```bash
php artisan mail:health-check --send-to=you@example.com --queue
```

## 6. Verify end-to-end app flow

1. Submit a public form (for example `/work-request`).
2. Confirm a new row exists in `work_request_entries`.
3. Confirm a queued job is created/processed.
4. Confirm notification email is received.

## 7. Contact us form flow

Public users can submit `/contact-us`. Each submission:

1. is stored in `contact_submissions`, and
2. sends queued notification emails to `WORK_FORMS_NOTIFICATION_RECIPIENTS`.
