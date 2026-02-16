#!/bin/bash

# Passkey (WebAuthn) Setup Script for JoshGen Office
# This script sets up passkey authentication for local development
#
# Usage: ./scripts/setup-passkeys.sh

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emoji support
CHECK="✓"
CROSS="✗"
INFO="ℹ"
ARROW="→"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Passkey (WebAuthn) Setup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print colored messages
print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_info() {
    echo -e "${YELLOW}${INFO} $1${NC}"
}

print_step() {
    echo -e "${BLUE}${ARROW} $1${NC}"
}

# Check if we're in the correct directory
if [ ! -f "composer.json" ]; then
    print_error "composer.json not found. Please run this script from the jg-forms directory."
    exit 1
fi

print_success "Found composer.json - we're in the right directory"
echo ""

# Step 1: Install Laravel WebAuthn package
print_step "Step 1: Installing Laravel WebAuthn package..."
if composer show asbiin/laravel-webauthn > /dev/null 2>&1; then
    VERSION=$(composer show asbiin/laravel-webauthn | grep 'versions' | awk '{print $3}')
    print_info "Package already installed (version: $VERSION)"
else
    composer require asbiin/laravel-webauthn:^5.4
    print_success "Package installed successfully"
fi
echo ""

# Step 2: Publish WebAuthn configuration
print_step "Step 2: Publishing WebAuthn configuration..."
if [ -f "config/webauthn.php" ]; then
    print_info "Configuration file already exists at config/webauthn.php"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        php artisan vendor:publish --provider="LaravelWebauthn\WebauthnServiceProvider" --tag="config" --force
        print_success "Configuration overwritten"
    else
        print_info "Keeping existing configuration"
    fi
else
    php artisan vendor:publish --provider="LaravelWebauthn\WebauthnServiceProvider" --tag="config"
    print_success "Configuration published to config/webauthn.php"
fi
echo ""

# Step 3: Copy and run migration
print_step "Step 3: Setting up database migration..."
MIGRATION_FILE=$(ls database/migrations/*_add_webauthn.php 2>/dev/null | head -n 1)

if [ -z "$MIGRATION_FILE" ]; then
    print_info "Copying migration from vendor package..."
    VENDOR_MIGRATION=$(ls vendor/asbiin/laravel-webauthn/database/migrations/*_add_webauthn.php 2>/dev/null | head -n 1)

    if [ -n "$VENDOR_MIGRATION" ]; then
        cp "$VENDOR_MIGRATION" database/migrations/
        print_success "Migration copied to database/migrations/"
    else
        print_error "Migration file not found in vendor package"
        exit 1
    fi
else
    print_info "Migration already exists: $(basename $MIGRATION_FILE)"
fi

# Check if migration has been run
if php artisan migrate:status | grep -q "add_webauthn"; then
    print_info "Migration already run"
else
    print_info "Running migration..."
    php artisan migrate --path=database/migrations --force
    print_success "Migration completed - webauthn_keys table created"
fi
echo ""

# Step 4: Verify User model has WebauthnAuthenticatable trait
print_step "Step 4: Verifying User model configuration..."
if grep -q "use LaravelWebauthn\\\\WebauthnAuthenticatable;" app/Models/User.php && \
   grep -q "use.*WebauthnAuthenticatable;" app/Models/User.php; then
    print_success "User model has WebauthnAuthenticatable trait"
else
    print_error "User model is missing WebauthnAuthenticatable trait!"
    echo ""
    print_info "Please add the following to app/Models/User.php:"
    echo ""
    echo "  use LaravelWebauthn\WebauthnAuthenticatable;"
    echo ""
    echo "  class User extends Authenticatable"
    echo "  {"
    echo "      use HasFactory, Notifiable, TwoFactorAuthenticatable, WebauthnAuthenticatable;"
    echo "  }"
    echo ""
    exit 1
fi
echo ""

# Step 5: Verify routes are set up
print_step "Step 5: Verifying WebAuthn routes..."
if grep -q "WebauthnKeyController" routes/web.php && \
   grep -q "AuthenticateController" routes/web.php; then
    print_success "WebAuthn routes configured in routes/web.php"
else
    print_error "WebAuthn routes are missing from routes/web.php!"
    echo ""
    print_info "Please ensure the following routes are in routes/web.php:"
    echo ""
    echo "  use LaravelWebauthn\Http\Controllers\AuthenticateController;"
    echo "  use LaravelWebauthn\Http\Controllers\WebauthnKeyController;"
    echo ""
    echo "  // Guest routes for login"
    echo "  Route::middleware(['web', 'guest'])->group(function () {"
    echo "      Route::post('/webauthn/login/options', [AuthenticateController::class, 'create']);"
    echo "      Route::post('/webauthn/login', [AuthenticateController::class, 'store']);"
    echo "  });"
    echo ""
    echo "  // Authenticated routes for registration"
    echo "  Route::middleware(['auth', 'verified'])->group(function () {"
    echo "      Route::post('/webauthn/register/options', [WebauthnKeyController::class, 'create']);"
    echo "      Route::post('/webauthn/register', [WebauthnKeyController::class, 'store']);"
    echo "      Route::delete('/webauthn/{id}', [WebauthnKeyController::class, 'destroy']);"
    echo "      Route::get('/settings/passkeys', function () {"
    echo "          return Inertia::render('settings/passkeys', ["
    echo "              'credentials' => auth()->user()->webauthnKeys()->get()"
    echo "          ]);"
    echo "      })->name('settings.passkeys');"
    echo "  });"
    echo ""
    exit 1
fi
echo ""

# Step 6: Verify frontend files exist
print_step "Step 6: Verifying frontend files..."
MISSING_FILES=()

# Check for required files
FILES=(
    "resources/js/pages/settings/passkeys.tsx"
    "resources/js/components/passkey-registration.tsx"
    "resources/js/lib/webauthn.ts"
    "resources/js/lib/webauthn-api.ts"
    "resources/js/types/webauthn.ts"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    print_success "All frontend files are in place"
else
    print_error "Missing frontend files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
    print_info "Please ensure all passkey frontend components are committed to the repository"
    exit 1
fi
echo ""

# Step 7: Check if site is secured with HTTPS
print_step "Step 7: Checking HTTPS configuration..."
if command -v herd > /dev/null 2>&1; then
    SITE_NAME=$(basename $(pwd) | sed 's/-joshgen//')

    print_info "Ensuring site is secured with HTTPS..."
    herd unsecure "$SITE_NAME" > /dev/null 2>&1 || true
    herd secure "$SITE_NAME"
    print_success "Site secured with TLS certificate"

    print_info "Site URL: https://${SITE_NAME}.test"
else
    print_info "Herd CLI not found - skipping HTTPS setup"
    print_info "Note: WebAuthn requires HTTPS in production and on localhost"
fi
echo ""

# Step 8: Build frontend assets
print_step "Step 8: Building frontend assets..."
if [ -f "package.json" ]; then
    print_info "Running npm install..."
    npm install --quiet

    print_info "Building assets with Vite..."
    npm run build
    print_success "Frontend assets built successfully"
else
    print_error "package.json not found!"
    exit 1
fi
echo ""

# Step 9: Clear Laravel caches
print_step "Step 9: Clearing Laravel caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
print_success "Caches cleared"
echo ""

# Final summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
print_success "Passkey authentication is now set up!"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Start your development server if not already running"
echo "  2. Visit https://$(basename $(pwd) | sed 's/-joshgen//').test/settings/passkeys"
echo "  3. Register a passkey using your device's biometric authentication"
echo "  4. Test passkey login at the login page"
echo ""
echo -e "${YELLOW}Important notes:${NC}"
echo "  - WebAuthn requires HTTPS (already configured via Herd)"
echo "  - Your browser must trust the local SSL certificate"
echo "  - Passkeys are stored securely on your device"
echo "  - Each passkey is unique to the device it's registered on"
echo ""
echo -e "${BLUE}Troubleshooting:${NC}"
echo "  - If you see certificate errors, restart your browser completely"
echo "  - Check the browser console for any JavaScript errors"
echo "  - Ensure your device supports biometric authentication"
echo "  - See PASSKEY_SETUP.md for detailed documentation"
echo ""
print_success "Happy developing!"
