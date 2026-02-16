#!/bin/bash

# JoshGen Office - Complete Setup Script
# Sets up local development environment with WebAuthn/Passkey support

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   JoshGen Office - Setup Script       ║"
echo "║   Local Development + Passkey Support  ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check project root
if [ ! -f "composer.json" ]; then
    print_error "Error: Not in project root. Please run from jg-forms directory."
    exit 1
fi

# ============================================
# Step 1: Check Prerequisites
# ============================================
echo "Step 1: Checking prerequisites..."
echo "-----------------------------------"

command -v php >/dev/null 2>&1 || { print_error "PHP not installed. Install PHP 8.2+"; exit 1; }
print_success "PHP $(php -v | head -n 1 | awk '{print $2}')"

command -v composer >/dev/null 2>&1 || { print_error "Composer not installed"; exit 1; }
print_success "Composer $(composer --version | awk '{print $3}')"

command -v node >/dev/null 2>&1 || { print_error "Node.js not installed. Install Node 18+"; exit 1; }
print_success "Node $(node -v)"

command -v npm >/dev/null 2>&1 || { print_error "npm not installed"; exit 1; }
print_success "npm $(npm -v)"

# ============================================
# Step 2: Install Dependencies
# ============================================
echo ""
echo "Step 2: Installing dependencies..."
echo "-----------------------------------"

echo "Installing PHP packages..."
composer install --quiet
print_success "PHP dependencies installed"

echo "Installing JavaScript packages..."
npm install --silent
print_success "JavaScript dependencies installed"

# ============================================
# Step 3: Environment Configuration
# ============================================
echo ""
echo "Step 3: Environment configuration..."
echo "-------------------------------------"

if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success "Created .env from .env.example"

    php artisan key:generate
    print_success "Generated application key"
else
    print_warning ".env already exists"

    if ! grep -q "APP_KEY=" .env || [ -z "$(grep APP_KEY= .env | cut -d '=' -f2)" ]; then
        php artisan key:generate
        print_success "Generated application key"
    fi
fi

# Ensure WEBAUTHN_USERLESS is set
if ! grep -q "WEBAUTHN_USERLESS" .env; then
    echo "WEBAUTHN_USERLESS=true" >> .env
    print_success "Added WEBAUTHN_USERLESS=true to .env"
elif ! grep -q "WEBAUTHN_USERLESS=true" .env; then
    sed -i.bak 's/WEBAUTHN_USERLESS=.*/WEBAUTHN_USERLESS=true/' .env && rm .env.bak
    print_success "Updated WEBAUTHN_USERLESS=true in .env"
fi

# ============================================
# Step 4: Database Setup
# ============================================
echo ""
echo "Step 4: Database setup..."
echo "--------------------------"

read -p "Run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if php artisan migrate --force 2>/dev/null; then
        print_success "Database migrations completed"

        read -p "Seed database with test data? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            php artisan db:seed
            print_success "Database seeded"
        fi
    else
        print_warning "Migration failed - check database connection in .env"
    fi
else
    print_warning "Skipped database migrations"
fi

# ============================================
# Step 5: WebAuthn/Passkey Setup
# ============================================
echo ""
echo "Step 5: WebAuthn/Passkey configuration..."
echo "------------------------------------------"

# Publish WebAuthn config if not exists
if [ ! -f "config/webauthn.php" ]; then
    php artisan vendor:publish --provider="LaravelWebauthn\ServiceProvider" --tag="config" --force
    print_success "Published WebAuthn configuration"
else
    print_success "WebAuthn configuration already exists"
fi

# Check if AppServiceProvider has WebAuthn config
if grep -q "configureWebauthn" app/Providers/AppServiceProvider.php; then
    print_success "AppServiceProvider already configured for WebAuthn"
else
    print_warning "AppServiceProvider needs manual WebAuthn configuration"
    print_info "See SETUP_GUIDE.md for details"
fi

# ============================================
# Step 6: Build Frontend Assets
# ============================================
echo ""
echo "Step 6: Building frontend assets..."
echo "------------------------------------"

read -p "Build frontend now? (y for production, d for dev mode, n to skip) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run build
    print_success "Frontend assets built (production)"
elif [[ $REPLY =~ ^[Dd]$ ]]; then
    print_info "Start dev server with: npm run dev"
else
    print_warning "Skipped frontend build"
fi

# ============================================
# Step 7: Storage and Cache
# ============================================
echo ""
echo "Step 7: Setting up storage and cache..."
echo "----------------------------------------"

if [ ! -L "public/storage" ]; then
    php artisan storage:link
    print_success "Storage linked"
else
    print_success "Storage already linked"
fi

php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
print_success "Caches cleared"

php artisan config:cache
php artisan route:cache
print_success "Configuration cached"

# ============================================
# Step 8: HTTPS Setup (Herd/Valet)
# ============================================
echo ""
echo "Step 8: HTTPS configuration..."
echo "-------------------------------"

SITE_NAME=$(basename "$PWD")

if command -v herd >/dev/null 2>&1; then
    print_success "Laravel Herd detected"

    read -p "Link site as '$SITE_NAME' with HTTPS? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        herd link "$SITE_NAME"
        herd secure "$SITE_NAME"
        print_success "Site secured: https://$SITE_NAME.test"

        # Update APP_URL in .env
        if grep -q "APP_URL=" .env; then
            sed -i.bak "s|APP_URL=.*|APP_URL=https://$SITE_NAME.test|" .env && rm .env.bak
        else
            echo "APP_URL=https://$SITE_NAME.test" >> .env
        fi
        print_success "Updated APP_URL in .env"

        php artisan config:clear
        php artisan config:cache
    fi
elif command -v valet >/dev/null 2>&1; then
    print_success "Laravel Valet detected"
    print_info "Run manually: valet link $SITE_NAME && valet secure $SITE_NAME"
else
    print_warning "Laravel Herd/Valet not detected"
    print_info "HTTPS required for WebAuthn - see SETUP_GUIDE.md"
fi

# ============================================
# Completion Summary
# ============================================
echo ""
echo "╔════════════════════════════════════════╗"
echo "║          Setup Complete! 🎉            ║"
echo "╚════════════════════════════════════════╝"
echo ""

print_success "Installation completed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure Database (if not done):"
echo "   Edit .env and set:"
echo "   - DB_DATABASE, DB_USERNAME, DB_PASSWORD"
echo "   Then run: php artisan migrate"
echo ""
echo "2. Start Development:"

if command -v herd >/dev/null 2>&1 && [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   Visit: https://$SITE_NAME.test"
else
    echo "   Terminal 1: php artisan serve"
    echo "   Terminal 2: npm run dev"
    echo "   Visit: http://localhost:8000"
fi

echo ""
echo "3. Test Passkey Authentication:"
echo "   - Register an account"
echo "   - Visit: /settings/passkeys"
echo "   - Click 'Register Passkey'"
echo "   - Logout and test 'Sign in with Passkey'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "   - SETUP_GUIDE.md - Complete setup and troubleshooting"
echo "   - README.md - Project overview"
echo ""
echo "❓ Need Help?"
echo "   - Check SETUP_GUIDE.md troubleshooting section"
echo "   - Review Laravel logs: storage/logs/laravel.log"
echo "   - Check browser console for frontend errors"
echo ""
echo "🎉 Happy coding!"
echo ""
