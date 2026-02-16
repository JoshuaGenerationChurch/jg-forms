# JoshGen Office - Forms Application

A Laravel 12 + React + Inertia.js application for managing work requests and forms at Joshua Generation Church.

## Features

- 📝 Work request form management
- 🔐 Secure authentication with Laravel Fortify
- 🔑 **Passkey (WebAuthn) support** - Login with Face ID, Touch ID, or Windows Hello
- 👤 Two-factor authentication
- 📊 Form submission tracking
- 🎨 Modern UI with React and Tailwind CSS

## Quick Start

### Automated Setup (Recommended)

Run the setup script to automatically configure your local environment:

```bash
chmod +x setup.sh
./setup.sh
```

The script will guide you through:
- Installing dependencies
- Setting up the database
- Configuring environment variables
- Building frontend assets
- Setting up WebAuthn/Passkey support
- Configuring HTTPS for local development

### Manual Setup

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed manual installation instructions.

## Requirements

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL or PostgreSQL
- Laravel Herd (recommended) or any PHP server with HTTPS support

## Tech Stack

- **Backend**: Laravel 12
- **Frontend**: React 19 + TypeScript
- **UI Framework**: Inertia.js
- **Styling**: Tailwind CSS 4
- **Authentication**: Laravel Fortify + WebAuthn
- **Build Tool**: Vite 7

## WebAuthn / Passkey Support

This application supports passwordless authentication using passkeys:

- 🍎 Face ID / Touch ID on Apple devices
- 🪟 Windows Hello on Windows
- 🤖 Fingerprint / Face unlock on Android
- 🔐 Hardware security keys (YubiKey, etc.)

### Quick Setup

The main setup script includes full passkey configuration:

```bash
./setup.sh
```

### Documentation

- 📖 [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup guide with WebAuthn/Passkey configuration
- 📝 [setup.sh](setup.sh) - Automated setup script

## Development

Start the development server:

```bash
# Terminal 1: Frontend dev server
npm run dev

# Terminal 2: Laravel server (if not using Herd)
php artisan serve
```

Visit `https://your-site.test` (or `http://localhost:8000`)

## Deployment

The application is deployed on Cloudways at: **https://office.joshgen.org**

### Critical Production Notes

When deploying to production, **ALWAYS** follow these steps in order:

1. **Update code files** via SSH or SFTP
2. **Install/update dependencies**: `composer install --no-dev --optimize-autoloader`
3. **Set environment variables** in `.env`:
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `WEBAUTHN_USERLESS=true` (required for passkey login)
4. **Clear config cache COMPLETELY**:
   ```bash
   rm -f bootstrap/cache/config.php
   php artisan config:clear
   php artisan config:cache
   ```
5. **Run database migrations**: `php artisan migrate --force`
6. **Build frontend assets**: `./node_modules/.bin/vite build`
7. **Clear Laravel caches**:
   ```bash
   php artisan route:clear
   php artisan view:clear
   ```
8. **Verify config**: `php artisan config:show webauthn.userless` (should return `true`)

**Critical**: Config cache must be cleared AFTER changing `.env` or passkey login will fail with "Authentication failed" error.

For detailed production deployment instructions and troubleshooting, see [SETUP_GUIDE.md - Production Deployment](SETUP_GUIDE.md#production-deployment)

## Project Structure

```
├── app/                    # Laravel application
├── resources/
│   ├── js/                # React components and pages
│   └── views/             # Blade templates
├── routes/                # Application routes
├── database/              # Migrations and seeders
├── public/                # Public assets
└── tests/                 # Test files
```

## Documentation

- 📘 [Complete Setup Guide](SETUP_GUIDE.md) - Local development, WebAuthn/Passkey configuration, and deployment
- 🚀 [Automated Setup Script](setup.sh) - One-command setup for local development

## Contributing

1. Clone the repository
2. Run `./setup.sh` to set up your environment
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## License

Proprietary - Joshua Generation Church

## Support

For issues or questions, contact the development team or check the documentation files.

---

Built with ❤️ for Joshua Generation Church
