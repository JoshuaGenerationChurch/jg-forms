#!/bin/bash

# Quick diagnostic script for 500 errors

echo "=========================================="
echo "Checking Laravel Error Logs..."
echo "=========================================="
echo ""

# Check if log file exists
if [ -f "storage/logs/laravel.log" ]; then
    echo "Last 50 lines of Laravel log:"
    echo "----------------------------------------"
    tail -50 storage/logs/laravel.log
else
    echo "❌ No log file found at storage/logs/laravel.log"
fi

echo ""
echo "=========================================="
echo "Checking File Permissions..."
echo "=========================================="
echo ""

ls -la storage/
ls -la bootstrap/cache/

echo ""
echo "=========================================="
echo "Checking Configuration..."
echo "=========================================="
echo ""

php artisan --version
php -v | head -1

echo ""
echo "Environment:"
grep -E "APP_ENV|APP_DEBUG|APP_KEY" .env 2>/dev/null || echo "Cannot read .env"

echo ""
echo "=========================================="
echo "Checking for Common Issues..."
echo "=========================================="
echo ""

# Check if APP_KEY is set
if grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    echo "✓ APP_KEY is set"
else
    echo "❌ APP_KEY not set or invalid"
    echo "   Run: php artisan key:generate"
fi

# Check storage permissions
if [ -w "storage" ]; then
    echo "✓ Storage is writable"
else
    echo "❌ Storage is not writable"
    echo "   Run: chmod -R 775 storage bootstrap/cache"
fi

# Check for composer autoload
if [ -f "vendor/autoload.php" ]; then
    echo "✓ Vendor autoload exists"
else
    echo "❌ Vendor folder missing"
    echo "   Run: composer install"
fi

# Check for cached config issues
if [ -f "bootstrap/cache/config.php" ]; then
    echo "⚠ Config is cached"
    echo "   If you changed .env, run: php artisan config:clear && php artisan config:cache"
fi

echo ""
echo "=========================================="
echo "Quick Fixes to Try:"
echo "=========================================="
echo ""
echo "1. Clear all caches:"
echo "   php artisan config:clear"
echo "   php artisan route:clear"
echo "   php artisan view:clear"
echo "   php artisan cache:clear"
echo ""
echo "2. Fix permissions:"
echo "   chmod -R 775 storage bootstrap/cache"
echo ""
echo "3. Rebuild autoloader:"
echo "   composer dump-autoload"
echo ""
echo "4. Cache for production:"
echo "   php artisan config:cache"
echo "   php artisan route:cache"
echo ""
