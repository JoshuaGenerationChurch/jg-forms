#!/bin/bash

# JoshGen Office Local Development Setup Script
# This script sets up the development environment for the JoshGen Office application

set -e  # Exit on error

echo "🚀 JoshGen Office - Local Development Setup"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "composer.json" ]; then
    print_error "Error: composer.json not found. Please run this script from the project root."
    exit 1
fi

print_success "Found project root"

# 1. Check for required tools
echo ""
echo "Step 1: Checking required tools..."
echo "-----------------------------------"

command -v php >/dev/null 2>&1 || { print_error "PHP is required but not installed. Aborting."; exit 1; }
print_success "PHP installed: $(php -v | head -n 1)"

command -v composer >/dev/null 2>&1 || { print_error "Composer is required but not installed. Aborting."; exit 1; }
print_success "Composer installed: $(composer --version | head -n 1)"

command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
print_success "Node.js installed: $(node -v)"

command -v npm >/dev/null 2>&1 || { print_error "NPM is required but not installed. Aborting."; exit 1; }
print_success "NPM installed: $(npm -v)"

# 2. Install PHP dependencies
echo ""
echo "Step 2: Installing PHP dependencies..."
echo "---------------------------------------"
composer install
print_success "PHP dependencies installed"

# 3. Install NPM dependencies
echo ""
echo "Step 3: Installing NPM dependencies..."
echo "---------------------------------------"
npm install
print_success "NPM dependencies installed"

# 4. Setup environment file
echo ""
echo "Step 4: Setting up environment configuration..."
echo "------------------------------------------------"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
    else
        print_warning ".env.example not found, creating basic .env"
        touch .env
    fi
else
    print_warning ".env file already exists, skipping..."
fi

# 5. Generate application key
echo ""
echo "Step 5: Generating application key..."
echo "--------------------------------------"
php artisan key:generate
print_success "Application key generated"

# 6. Setup database
echo ""
echo "Step 6: Database setup..."
echo "-------------------------"
read -p "Do you want to run migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    php artisan migrate
    print_success "Database migrations completed"

    read -p "Do you want to seed the database? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        php artisan db:seed
        print_success "Database seeded"
    fi
else
    print_warning "Skipping database migrations"
fi

# 7. Setup WebAuthn (Passkey support)
echo ""
echo "Step 7: Setting up WebAuthn (Passkey) support..."
echo "-------------------------------------------------"
php artisan vendor:publish --provider="LaravelWebauthn\ServiceProvider" --force
print_success "WebAuthn configuration published"

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_success "WebAuthn migrations already run"
else
    read -p "Do you want to run WebAuthn migrations now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        php artisan migrate
        print_success "WebAuthn migrations completed"
    fi
fi

# 8. Build frontend assets
echo ""
echo "Step 8: Building frontend assets..."
echo "------------------------------------"
read -p "Do you want to build frontend assets now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run build
    print_success "Frontend assets built"
else
    print_warning "Skipping frontend build. Run 'npm run dev' or 'npm run build' later."
fi

# 9. Setup storage and cache
echo ""
echo "Step 9: Setting up storage and cache..."
echo "----------------------------------------"
php artisan storage:link
print_success "Storage linked"

php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
print_success "Caches cleared"

# 10. Check if using Laravel Herd
echo ""
echo "Step 10: Development server setup..."
echo "-------------------------------------"
if command -v herd >/dev/null 2>&1; then
    print_success "Laravel Herd detected"

    # Get the directory name for the site
    SITE_NAME=$(basename "$PWD")

    read -p "Do you want to link this site in Herd as '$SITE_NAME'? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd public && herd link "$SITE_NAME"
        print_success "Site linked in Herd: https://$SITE_NAME.test"

        read -p "Do you want to secure the site with HTTPS? (required for Passkeys) (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            herd secure "$SITE_NAME"
            print_success "Site secured with HTTPS"
        fi
        cd ..
    fi
else
    print_warning "Laravel Herd not detected"
    echo "You can serve the application using:"
    echo "  php artisan serve"
    echo ""
    echo "Note: WebAuthn/Passkeys require HTTPS in production."
fi

# 11. Final checks
echo ""
echo "Step 11: Final verification..."
echo "-------------------------------"

# Check if .env has required variables
if ! grep -q "APP_KEY=" .env || [ -z "$(grep APP_KEY= .env | cut -d '=' -f2)" ]; then
    print_warning "APP_KEY not set in .env"
else
    print_success "APP_KEY is configured"
fi

if ! grep -q "DB_DATABASE=" .env; then
    print_warning "DB_DATABASE not configured in .env"
else
    print_success "Database configuration found"
fi

# Summary
echo ""
echo "========================================="
echo "✨ Setup Complete!"
echo "========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure your .env file with database credentials:"
echo "   - DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD"
echo ""
echo "2. For WebAuthn/Passkey support, ensure in .env:"
echo "   - APP_URL=https://your-site.test"
echo "   - WEBAUTHN_RP_ID=your-site.test"
echo "   - WEBAUTHN_RP_NAME=\"Your App Name\""
echo ""
echo "3. Start development server:"
if command -v herd >/dev/null 2>&1; then
    if [ -n "$SITE_NAME" ]; then
        echo "   Visit: https://$SITE_NAME.test"
    else
        echo "   Run: herd link <site-name>"
    fi
else
    echo "   Run: php artisan serve"
fi
echo ""
echo "4. Start frontend development:"
echo "   Run: npm run dev"
echo ""
echo "5. Test Passkey feature:"
echo "   - Login page will show 'Sign in with Passkey' on supported devices"
echo "   - Visit /settings/passkeys to register a passkey"
echo ""
echo "📚 Documentation:"
echo "   - PASSKEY_IMPLEMENTATION.md - Passkey setup guide"
echo "   - WEBAUTHN_DEPLOYMENT.md - Deployment instructions"
echo ""
echo "🎉 Happy coding!"
echo ""
