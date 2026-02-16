#!/bin/bash

# JoshGen Office - Production Deployment Script
# Run this on the production server after SSHing in

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
echo "║   JoshGen Office - Production Deploy  ║"
echo "║   WebAuthn/Passkey Installation        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "composer.json" ]; then
    print_error "Error: Not in project root. Please cd to the correct directory."
    exit 1
fi

print_success "Found project root: $(pwd)"

# ============================================
# Step 1: Pull Latest Code
# ============================================
echo ""
echo "Step 1: Pulling latest code..."
echo "-------------------------------"

if [ -d ".git" ]; then
    git pull origin main
    print_success "Code updated from repository"
else
    print_warning "Not a git repository - skipping"
fi

# ============================================
# Step 2: Install/Update Dependencies
# ============================================
echo ""
echo "Step 2: Installing dependencies..."
echo "-----------------------------------"

# Check if composer is available
if command -v composer >/dev/null 2>&1; then
    composer install --no-dev --optimize-autoloader
    print_success "Composer dependencies installed"
else
    print_error "Composer not found - install manually"
fi

# Install npm packages
if command -v npm >/dev/null 2>&1; then
    npm install --production
    print_success "NPM dependencies installed"
else
    print_warning "npm not found - frontend build may fail"
fi

# ============================================
# Step 3: Environment Check
# ============================================
echo ""
echo "Step 3: Checking environment..."
echo "---------------------------------"

if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_info "Copy from .env.example and configure"
    exit 1
fi

if ! grep -q "WEBAUTHN_USERLESS=true" .env; then
    print_warning "WEBAUTHN_USERLESS not set to true"
    print_info "Add to .env: WEBAUTHN_USERLESS=true"

    read -p "Add WEBAUTHN_USERLESS=true to .env now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if grep -q "WEBAUTHN_USERLESS" .env; then
            sed -i.bak 's/WEBAUTHN_USERLESS=.*/WEBAUTHN_USERLESS=true/' .env && rm .env.bak
        else
            echo "WEBAUTHN_USERLESS=true" >> .env
        fi
        print_success "Added WEBAUTHN_USERLESS=true to .env"
    fi
fi

# ============================================
# Step 4: Run Migrations
# ============================================
echo ""
echo "Step 4: Running database migrations..."
echo "---------------------------------------"

php artisan migrate --force
print_success "Migrations completed"

# ============================================
# Step 5: Build Frontend Assets
# ============================================
echo ""
echo "Step 5: Building frontend assets..."
echo "------------------------------------"

if [ -f "node_modules/.bin/vite" ]; then
    ./node_modules/.bin/vite build
    print_success "Frontend assets built"
else
    print_error "Vite not found - run: npm install"
    exit 1
fi

# ============================================
# Step 6: Clear and Cache
# ============================================
echo ""
echo "Step 6: Clearing and caching..."
echo "--------------------------------"

php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
print_success "All caches cleared"

php artisan config:cache
php artisan route:cache
print_success "Configuration cached for production"

# ============================================
# Step 7: Set Permissions
# ============================================
echo ""
echo "Step 7: Setting permissions..."
echo "-------------------------------"

chmod -R 755 storage bootstrap/cache
print_success "Storage permissions set"

# ============================================
# Step 8: Verify WebAuthn Setup
# ============================================
echo ""
echo "Step 8: Verifying WebAuthn setup..."
echo "------------------------------------"

# Check if webauthn config exists
if [ -f "config/webauthn.php" ]; then
    print_success "WebAuthn config exists"
else
    print_warning "WebAuthn config missing"
    print_info "Run: php artisan vendor:publish --provider=\"LaravelWebauthn\ServiceProvider\""
fi

# Check if User model has trait
if grep -q "WebauthnAuthenticatable" app/Models/User.php; then
    print_success "User model has WebauthnAuthenticatable trait"
else
    print_warning "User model missing WebauthnAuthenticatable trait"
fi

# Check if AppServiceProvider has WebAuthn config
if grep -q "configureWebauthn" app/Providers/AppServiceProvider.php; then
    print_success "AppServiceProvider configured for WebAuthn"
else
    print_error "AppServiceProvider missing configureWebauthn() method"
    print_info "This is CRITICAL for userless login!"
fi

# ============================================
# Completion Summary
# ============================================
echo ""
echo "╔════════════════════════════════════════╗"
echo "║       Deployment Complete! 🎉          ║"
echo "╚════════════════════════════════════════╝"
echo ""

print_success "Production deployment successful!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Verify Environment Variables:"
echo "   Check .env has:"
echo "   - APP_ENV=production"
echo "   - APP_DEBUG=false"
echo "   - APP_URL=https://office.joshgen.org"
echo "   - WEBAUTHN_USERLESS=true"
echo ""
echo "2. Test the Application:"
echo "   Visit: https://office.joshgen.org"
echo ""
echo "3. Test Passkey Authentication:"
echo "   - Login with password"
echo "   - Visit: /settings/passkeys"
echo "   - Register a passkey"
echo "   - Logout and test 'Sign in with Passkey'"
echo ""
echo "4. Monitor Logs:"
echo "   tail -f storage/logs/laravel.log"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔐 WebAuthn/Passkey Status:"

if [ -f "config/webauthn.php" ] && \
   grep -q "WebauthnAuthenticatable" app/Models/User.php && \
   grep -q "configureWebauthn" app/Providers/AppServiceProvider.php && \
   grep -q "WEBAUTHN_USERLESS=true" .env; then
    echo ""
    print_success "All WebAuthn components are properly configured!"
    echo ""
    print_info "Passkey authentication should be working on:"
    print_info "  - Login page: 'Sign in with Passkey' button"
    print_info "  - Settings: /settings/passkeys"
else
    echo ""
    print_warning "Some WebAuthn components may need attention"
    print_info "Check the verification output above"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
