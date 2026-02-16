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
chmod +x setup-local.sh
./setup-local.sh
```

The script will guide you through:
- Installing dependencies
- Setting up the database
- Configuring environment variables
- Building frontend assets
- Setting up WebAuthn/Passkey support

### Manual Setup

See [LOCAL_SETUP.md](LOCAL_SETUP.md) for detailed manual installation instructions.

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

For new developers setting up passkey authentication:

```bash
cd jg-forms
./scripts/setup-passkeys.sh
```

This automated script will install dependencies, configure the database, and set up HTTPS.

### Documentation

- 📖 [PASSKEY_SETUP.md](PASSKEY_SETUP.md) - Complete setup guide and troubleshooting
- ✅ [PASSKEY_CHECKLIST.md](PASSKEY_CHECKLIST.md) - Verification checklist for developers
- 📝 [scripts/setup-passkeys.sh](scripts/setup-passkeys.sh) - Automated setup script

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

For production deployment with passkey support, see [PASSKEY_SETUP.md](PASSKEY_SETUP.md#production-deployment)

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

- 📘 [Local Setup Guide](LOCAL_SETUP.md) - Complete local development setup
- 🔐 [Passkey Setup Guide](PASSKEY_SETUP.md) - WebAuthn/Passkey implementation and troubleshooting
- ✅ [Passkey Checklist](PASSKEY_CHECKLIST.md) - Verification checklist for passkey setup
- 🚀 [Passkey Setup Script](scripts/setup-passkeys.sh) - Automated installation script

## Contributing

1. Clone the repository
2. Run `./setup-local.sh` to set up your environment
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## License

Proprietary - Joshua Generation Church

## Support

For issues or questions, contact the development team or check the documentation files.

---

Built with ❤️ for Joshua Generation Church
