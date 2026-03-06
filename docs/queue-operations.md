# Queue Operations Runbook

This project sends mail through queued jobs. Production must keep queue workers running.

## 1. Required configuration

Set in `.env`:

```env
QUEUE_CONNECTION=database
```

Ensure queue tables exist:

```bash
php artisan migrate --force
```

## 2. Health checks

Basic queue health:

```bash
php artisan queue:health-check
```

With stricter thresholds:

```bash
php artisan queue:health-check --warn-backlog=20 --warn-failed=0
```

Check specific queue name:

```bash
php artisan queue:health-check --queue=default
```

## 3. Deployment sequence (queue-safe)

```bash
php artisan down
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart
php artisan up
```

## 4. Supervisor example (recommended)

Create `/etc/supervisor/conf.d/jg-forms-queue.conf`:

```ini
[program:jg-forms-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/jg-forms/artisan queue:work database --queue=default --sleep=3 --tries=1 --timeout=120
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/jg-forms/storage/logs/queue-worker.log
stopwaitsecs=3600
```

Then:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

### 4.1 Cloudways quick setup (this project)

If your app path is:

`/home/1197962.cloudwaysapps.com/hczbsjjmgr/public_html`

use this worker command:

```bash
php /home/1197962.cloudwaysapps.com/hczbsjjmgr/public_html/artisan queue:work database --queue=default --sleep=3 --tries=1 --timeout=120 --max-time=3600
```

If you have root/sudo access, use Supervisor with:

```ini
[program:jg-forms-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /home/1197962.cloudwaysapps.com/hczbsjjmgr/public_html/artisan queue:work database --queue=default --sleep=3 --tries=1 --timeout=120 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
numprocs=1
redirect_stderr=true
stdout_logfile=/home/1197962.cloudwaysapps.com/hczbsjjmgr/public_html/storage/logs/queue-worker.log
stopwaitsecs=3600
```

If you do not have root/sudo, use cron fallback:

```cron
* * * * * cd /home/1197962.cloudwaysapps.com/hczbsjjmgr/public_html && php artisan queue:work database --queue=default --stop-when-empty --sleep=3 --tries=1 --timeout=120 >> /home/1197962.cloudwaysapps.com/hczbsjjmgr/public_html/storage/logs/queue-worker-cron.log 2>&1
```

This runs every minute and drains queued jobs even without Supervisor.

## 5. systemd alternative

Create `/etc/systemd/system/jg-forms-queue.service`:

```ini
[Unit]
Description=JG Forms Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/jg-forms/artisan queue:work database --queue=default --sleep=3 --tries=1 --timeout=120
WorkingDirectory=/var/www/jg-forms
StandardOutput=append:/var/www/jg-forms/storage/logs/queue-worker.log
StandardError=append:/var/www/jg-forms/storage/logs/queue-worker.log

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now jg-forms-queue
sudo systemctl status jg-forms-queue
```

## 6. Incident flow

1. Check failed jobs:

```bash
php artisan queue:failed
```

2. Retry specific/all failed jobs:

```bash
php artisan queue:retry <id>
php artisan queue:retry all
```

3. If workers are stale after deploy:

```bash
php artisan queue:restart
```

4. If needed (destructive), clear failed jobs:

```bash
php artisan queue:flush
```

## 7. Monitoring command to use in production

Use strict thresholds so any backlog is visible immediately:

```bash
php artisan queue:health-check --warn-backlog=0 --warn-failed=0
```
