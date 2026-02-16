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

See [PASSKEY_IMPLEMENTATION.md](PASSKEY_IMPLEMENTATION.md) for implementation details.

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

See [WEBAUTHN_DEPLOYMENT.md](WEBAUTHN_DEPLOYMENT.md) for production deployment instructions.

The application is deployed on Cloudways at: **https://office.joshgen.org**

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

- [Local Setup Guide](LOCAL_SETUP.md) - Complete local development setup
- [Passkey Implementation](PASSKEY_IMPLEMENTATION.md) - WebAuthn/Passkey documentation
- [Deployment Guide](WEBAUTHN_DEPLOYMENT.md) - Production deployment steps

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
