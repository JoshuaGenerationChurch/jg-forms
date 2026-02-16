# Local Development Setup Guide

This guide will help you set up the JoshGen Office application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **PHP 8.2+** with required extensions (mbstring, xml, curl, pdo, etc.)
- **Composer** (PHP dependency manager)
- **Node.js 18+** and **NPM**
- **MySQL** or **PostgreSQL** database
- **Laravel Herd** (recommended) or any local PHP server

## Quick Setup (Recommended)

We've created an automated setup script that handles all the configuration for you:

```bash
./setup-local.sh
```

This script will:
1. ✅ Check for required tools (PHP, Composer, Node.js, NPM)
2. ✅ Install PHP dependencies via Composer
3. ✅ Install NPM dependencies
4. ✅ Create and configure `.env` file
5. ✅ Generate application key
6. ✅ Run database migrations (optional)
7. ✅ Set up WebAuthn/Passkey support
8. ✅ Build frontend assets (optional)
9. ✅ Link site in Laravel Herd (if available)
10. ✅ Clear all caches

## Manual Setup

If you prefer to set things up manually:

### 1. Clone the Repository

```bash
git clone https://github.com/JoshuaGenerationChurch/jg-forms.git
cd jg-forms
```

### 2. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install NPM dependencies
npm install
```

### 3. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

Edit `.env` and configure your database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=jg_forms
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

For **WebAuthn/Passkey support**, add these (required for HTTPS):

```env
APP_URL=https://jg-forms.test
WEBAUTHN_RP_ID=jg-forms.test
WEBAUTHN_RP_NAME="JoshGen Office"
```

### 4. Database Setup

```bash
# Run migrations
php artisan migrate

# (Optional) Seed database with sample data
php artisan db:seed
```

### 5. WebAuthn Setup

```bash
# Publish WebAuthn configuration and migrations
php artisan vendor:publish --provider="LaravelWebauthn\ServiceProvider"

# Run WebAuthn migrations (creates webauthn_keys table)
php artisan migrate
```

### 6. Storage and Cache

```bash
# Create symbolic link for storage
php artisan storage:link

# Clear all caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
```

### 7. Frontend Assets

```bash
# For development (with hot reload)
npm run dev

# For production build
npm run build
```

### 8. Start Development Server

#### Using Laravel Herd (Recommended):

```bash
cd public
herd link jg-forms
herd secure jg-forms  # Required for Passkeys
```

Visit: `https://jg-forms.test`

#### Using Artisan:

```bash
php artisan serve
```

Visit: `http://localhost:8000`

**Note:** Passkeys require HTTPS. Use Laravel Herd or configure SSL for local development.

## Testing Passkey Feature

Once your local environment is set up:

1. **Visit the login page**
   - On devices with Touch ID, Face ID, or Windows Hello, you'll see a "Sign in with Passkey" button
   
2. **Register a Passkey**
   - Login with email/password first
   - Navigate to Settings → Passkeys (`/settings/passkeys`)
   - Click "Register Passkey"
   - Follow your device's biometric prompt
   
3. **Test Passkey Login**
   - Logout
   - Click "Sign in with Passkey" on login page
   - Authenticate with your biometric

## Troubleshooting

### Passkey button doesn't appear

- ✅ Ensure you're using HTTPS (required for WebAuthn)
- ✅ Check browser console for errors
- ✅ Verify your device supports platform authenticator (Touch ID, Face ID, Windows Hello)
- ✅ Ensure `WEBAUTHN_RP_ID` in `.env` matches your domain

### Database errors

- ✅ Check database credentials in `.env`
- ✅ Ensure database exists: `mysql -u root -e "CREATE DATABASE jg_forms;"`
- ✅ Run migrations: `php artisan migrate`

### NPM build errors

- ✅ Clear NPM cache: `npm cache clean --force`
- ✅ Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- ✅ Check Node.js version: `node -v` (should be 18+)

### Laravel errors

- ✅ Clear all caches: `php artisan config:clear && php artisan cache:clear`
- ✅ Check permissions: `chmod -R 775 storage bootstrap/cache`
- ✅ Regenerate key: `php artisan key:generate`

## Project Structure

```
jg-forms/
├── app/                      # Laravel application code
│   ├── Models/User.php      # User model with WebauthnAuthenticatable
│   └── Http/Controllers/    # API controllers
├── resources/
│   ├── js/
│   │   ├── components/      # React components
│   │   │   └── passkey-registration.tsx
│   │   ├── pages/
│   │   │   ├── auth/login.tsx         # Login with passkey button
│   │   │   └── settings/passkeys.tsx  # Passkey management
│   │   ├── lib/
│   │   │   ├── webauthn.ts       # WebAuthn helper functions
│   │   │   └── webauthn-api.ts   # API endpoints
│   │   └── types/
│   │       └── webauthn.ts       # TypeScript types
│   └── views/               # Blade templates
├── routes/
│   └── web.php             # Application routes (includes WebAuthn routes)
├── public/                 # Public assets
└── database/
    └── migrations/         # Database migrations
```

## Additional Resources

- **Passkey Implementation Guide**: `PASSKEY_IMPLEMENTATION.md`
- **Deployment Guide**: `WEBAUTHN_DEPLOYMENT.md`
- **Laravel Documentation**: https://laravel.com/docs
- **Inertia.js Documentation**: https://inertiajs.com
- **WebAuthn Guide**: https://webauthn.guide

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review Laravel logs: `tail -f storage/logs/laravel.log`
3. Check browser console for JavaScript errors
4. Consult the documentation files in the project root

## Development Workflow

1. **Start development server**:
   ```bash
   # Terminal 1: Laravel Herd or php artisan serve
   # Terminal 2: Frontend dev server
   npm run dev
   ```

2. **Make changes** to your code

3. **Test locally** at `https://jg-forms.test` (or your configured URL)

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

5. **Deploy to production** via Cloudways dashboard

Happy coding! 🚀
