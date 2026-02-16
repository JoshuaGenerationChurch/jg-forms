# Quick Start Guide

Get up and running with JoshGen Office in 5 minutes.

## One-Command Setup

```bash
./setup.sh
```

That's it! The script handles everything:
- ✓ Dependency installation
- ✓ Environment configuration
- ✓ Database migrations
- ✓ WebAuthn/Passkey setup
- ✓ HTTPS configuration
- ✓ Frontend build

## What You Get

- **Passwordless Login** - Face ID, Touch ID, Windows Hello
- **Modern Stack** - Laravel 12 + React 19 + Inertia.js
- **Secure by Default** - HTTPS + WebAuthn authentication
- **Ready to Deploy** - Production-ready configuration

## Access Your Site

After setup:

**With Laravel Herd:**
```
https://office-joshgen.test
```

**Without Herd:**
```bash
# Terminal 1
php artisan serve

# Terminal 2  
npm run dev

# Visit: http://localhost:8000
```

## Test Passkey Authentication

1. Register an account
2. Go to **Settings → Passkeys**
3. Click **"Register Passkey"**
4. Complete biometric prompt
5. Logout and test **"Sign in with Passkey"**

## Need Help?

- **Full Guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Project Info:** [README.md](README.md)
- **Laravel Logs:** `storage/logs/laravel.log`
- **Browser Console:** Press F12

## Common Commands

```bash
# Start development
npm run dev                    # Frontend hot-reload
php artisan serve              # Backend server (if not using Herd)

# Database
php artisan migrate           # Run migrations
php artisan db:seed           # Seed test data

# Build production assets
npm run build

# Clear caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Cache for production
php artisan config:cache
php artisan route:cache
```

## Production Deployment

```bash
# On production server
git pull origin main
composer install --no-dev --optimize-autoloader
./node_modules/.bin/vite build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

See [SETUP_GUIDE.md - Production Deployment](SETUP_GUIDE.md#production-deployment) for details.

## Browser Support

- ✅ Chrome 67+
- ✅ Firefox 60+
- ✅ Safari 13+
- ✅ Edge 18+

## Requirements

- PHP 8.2+
- Node.js 18+
- MySQL/PostgreSQL
- HTTPS (for WebAuthn)

---

**Need more details?** See [SETUP_GUIDE.md](SETUP_GUIDE.md) for complete documentation.
