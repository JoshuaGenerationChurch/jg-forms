# JG Forms - Cloudways Deployment Guide

This guide covers the complete deployment process for the JG Forms application to Cloudways, including GitHub integration, database setup, Node.js configuration, and Laravel setup.

---

## Prerequisites

- Cloudways account with a provisioned server
- GitHub account with access to the repository
- SSH access to your Cloudways server
- Basic knowledge of Laravel and Git

---

## 1. Server Requirements

### Cloudways Server Specifications
- **PHP Version**: 8.2 or higher
- **Node.js Version**: 18.x or higher
- **Database**: MySQL 8.0+
- **Web Server**: Nginx (recommended)
- **Composer**: Latest version
- **Git**: Installed and configured

---

## 2. Initial Server Setup on Cloudways

### 2.1 Create Application
1. Log in to Cloudways dashboard
2. Navigate to **Applications**
3. Click **Add Application**
4. Select:
   - **Application**: PHP (Custom)
   - **Name**: jg-forms
   - **Server**: Your target server
5. Note the application URL and server IP

### 2.2 Configure Application Settings
1. Go to **Application Settings**
2. Set **Application URL** to your production domain
3. Note the **Application Path** (e.g., `/home/XXXXX.cloudwaysapps.com/XXXXX/public_html`)

---

## 3. GitHub Integration Setup

### 3.1 Generate SSH Key on Cloudways Server
```bash
# SSH into your Cloudways server
ssh MASTER_USER@YOUR_SERVER_IP

# Generate SSH key (if not exists)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Display public key
cat ~/.ssh/id_ed25519.pub
```

### 3.2 Add Deploy Key to GitHub
1. Go to your GitHub repository: `https://github.com/JoshuaGenerationChurch/jg-forms`
2. Navigate to **Settings** → **Deploy keys**
3. Click **Add deploy key**
4. Title: `Cloudways Production Server`
5. Paste the public key from above
6. Check **Allow write access** (if you plan to push from server)
7. Click **Add key**

### 3.3 Clone Repository
```bash
# Navigate to application directory
cd /home/XXXXX.cloudwaysapps.com/XXXXX

# Remove default public_html if exists
rm -rf public_html

# Clone repository
git clone git@github.com:JoshuaGenerationChurch/jg-forms.git public_html

# Navigate to project
cd public_html
```

### 3.4 Set Up Git for Future Deployments
```bash
# Configure Git
git config user.name "Your Name"
git config user.email "your_email@example.com"

# Set up main branch tracking
git branch --set-upstream-to=origin/main main
```

---

## 4. Database Configuration

### 4.1 Create MySQL Database via Cloudways
1. In Cloudways dashboard, go to **Application Management**
2. Click **Access Details**
3. Note the **MySQL Access** credentials:
   - Host
   - Database Name
   - Username
   - Password
   - Port (usually 3306)

### 4.2 Test Database Connection
```bash
# Test MySQL connection from server
mysql -h HOST -P PORT -u USERNAME -p DATABASE_NAME
# Enter password when prompted
# If successful, you'll see MySQL prompt
# Type 'exit' to quit
```

---

## 5. Environment Configuration

### 5.1 Create Production .env File
```bash
cd /home/XXXXX.cloudwaysapps.com/XXXXX/public_html

# Copy production example
cp .env.production.example .env

# Edit .env file
nano .env
```

### 5.2 Configure .env Variables
Update the following critical variables:

```env
APP_NAME="JG Forms"
APP_ENV=production
APP_KEY=  # Will be generated in next step
APP_DEBUG=false
APP_URL=https://your-domain.com

LOG_LEVEL=info

# Database Configuration (from Cloudways MySQL Access Details)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1  # or your MySQL host
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

# Session Configuration
SESSION_DRIVER=database
SESSION_DOMAIN=.your-domain.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

# Mail Configuration (optional - configure if needed)
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-smtp-username
MAIL_PASSWORD=your-smtp-password
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"

# JG API Configuration
JG_API_BASE_URL=your-api-url
JG_API_TOKEN=your-api-token

# Work Forms Admin Emails (comma-separated)
WORK_FORMS_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

**Important Notes:**
- **Never commit .env to Git** - it's in .gitignore by default
- Keep production credentials secure
- Use strong database passwords
- Enable SESSION_SECURE_COOKIE=true for HTTPS

---

## 6. Composer Dependencies Installation

### 6.1 Install PHP Dependencies
```bash
cd /home/XXXXX.cloudwaysapps.com/XXXXX/public_html

# Install Composer dependencies (production only, optimized)
composer install --optimize-autoloader --no-dev
```

**Troubleshooting:**
- If Composer is not found, install it:
  ```bash
  php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
  php composer-setup.php
  php -r "unlink('composer-setup.php');"
  sudo mv composer.phar /usr/local/bin/composer
  ```

---

## 7. Laravel Application Setup

### 7.1 Generate Application Key
```bash
php artisan key:generate
```

This will populate the `APP_KEY` in your `.env` file.

### 7.2 Run Database Migrations
```bash
# Run migrations
php artisan migrate --force

# Verify migrations ran successfully
php artisan migrate:status
```

### 7.3 Create Storage Link
```bash
php artisan storage:link
```

### 7.4 Set Proper Permissions
```bash
# Set ownership (replace with your Cloudways user)
chown -R CLOUDWAYS_USER:CLOUDWAYS_USER /home/XXXXX.cloudwaysapps.com/XXXXX/public_html

# Set directory permissions
find /home/XXXXX.cloudwaysapps.com/XXXXX/public_html -type d -exec chmod 755 {} \;

# Set file permissions
find /home/XXXXX.cloudwaysapps.com/XXXXX/public_html -type f -exec chmod 644 {} \;

# Set writable directories
chmod -R 775 /home/XXXXX.cloudwaysapps.com/XXXXX/public_html/storage
chmod -R 775 /home/XXXXX.cloudwaysapps.com/XXXXX/public_html/bootstrap/cache
```

---

## 8. Node.js and NPM Setup

### 8.1 Verify Node.js Version
```bash
node --version
# Should show v18.x or higher

npm --version
```

**If Node.js is not installed or outdated:**
```bash
# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
```

### 8.2 Install NPM Dependencies
```bash
cd /home/XXXXX.cloudwaysapps.com/XXXXX/public_html

# Install dependencies (production)
npm ci --production=false
```

**Note:** We use `npm ci` instead of `npm install` for faster, cleaner installs in production. The `--production=false` flag ensures devDependencies are installed for the build process.

---

## 9. Vite Build Process

### 9.1 Build Frontend Assets
```bash
cd /home/XXXXX.cloudwaysapps.com/XXXXX/public_html

# Build production assets
npm run build
```

**Expected Output:**
- Compiled JavaScript and CSS files in `public/build/`
- Manifest file: `public/build/manifest.json`
- Asset files with hashed names for cache busting

### 9.2 Verify Build Success
```bash
# Check if manifest exists
ls -la public/build/manifest.json

# Check build directory
ls -la public/build/
```

**Common Build Issues:**

**Issue 1: npm cache permissions**
```bash
# If you encounter cache permission errors, use:
./node_modules/.bin/vite build
```

**Issue 2: Out of memory**
```bash
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

**Issue 3: Missing dependencies**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 10. Laravel Cache Optimization

### 10.1 Cache Configuration
```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache
```

### 10.2 Clear Caches (if needed)
```bash
# Clear all caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
```

---

## 11. Webroot Configuration

### 11.1 Set Webroot in Cloudways
1. Go to Cloudways dashboard
2. Navigate to **Application Management** → **Application Settings**
3. Set **Webroot** to: `public_html/public`
4. Click **Save Changes**

### 11.2 Verify Webroot
Your Laravel app's `public` directory should now be the document root.

---

## 12. SSL Certificate Setup

### 12.1 Enable SSL via Cloudways
1. In Cloudways dashboard, go to **SSL Certificate**
2. Select your domain
3. Click **Install Certificate**
4. Cloudways will generate a free Let's Encrypt SSL certificate

### 12.2 Force HTTPS (Optional)
Add to `.env`:
```env
FORCE_HTTPS=true
```

Update `app/Http/Middleware/TrustProxies.php` if needed.

---

## 13. Queue Worker Setup (Optional)

If your application uses queues:

### 13.1 Configure Supervisor
```bash
# Create supervisor config
sudo nano /etc/supervisor/conf.d/jg-forms-worker.conf
```

Add:
```ini
[program:jg-forms-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/XXXXX.cloudwaysapps.com/XXXXX/public_html/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=CLOUDWAYS_USER
numprocs=1
redirect_stderr=true
stdout_logfile=/home/XXXXX.cloudwaysapps.com/XXXXX/public_html/storage/logs/worker.log
stopwaitsecs=3600
```

### 13.2 Start Supervisor
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start jg-forms-worker:*
```

---

## 14. Deployment Workflow (Future Updates)

### 14.1 Automated Deployment Script
Create a deployment script: `deploy.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Navigate to project
cd /home/XXXXX.cloudwaysapps.com/XXXXX/public_html

# Put application in maintenance mode
php artisan down

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install/update dependencies
echo "📦 Installing Composer dependencies..."
composer install --optimize-autoloader --no-dev

# Install/update NPM dependencies
echo "📦 Installing NPM dependencies..."
npm ci --production=false

# Build frontend assets
echo "🏗️  Building frontend assets..."
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# Clear and cache config
echo "🧹 Clearing and caching configuration..."
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart queue workers (if using supervisor)
# sudo supervisorctl restart jg-forms-worker:*

# Bring application back up
php artisan up

echo "✅ Deployment completed successfully!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

### 14.2 Deploy Future Updates
```bash
cd /home/XXXXX.cloudwaysapps.com/XXXXX/public_html
./deploy.sh
```

---

## 15. Post-Deployment Verification

### 15.1 Check Application Health
1. Visit your production URL: `https://your-domain.com`
2. Verify the homepage loads
3. Test authentication (login/register)
4. Check form functionality
5. Verify database connections

### 15.2 Check Logs
```bash
# View Laravel logs
tail -f storage/logs/laravel.log

# Check web server logs (Cloudways)
# Access via Cloudways dashboard → Application Management → Access Logs
```

### 15.3 Test Key Features
- [ ] Homepage loads correctly
- [ ] CSS and JavaScript assets load (no 404 errors)
- [ ] User authentication works
- [ ] Forms can be created and submitted
- [ ] Database queries execute successfully
- [ ] Email functionality (if configured)

---

## 16. Troubleshooting Common Issues

### Issue: 500 Internal Server Error
**Solution:**
```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Verify permissions
chmod -R 775 storage bootstrap/cache

# Clear and recache
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### Issue: Assets not loading (CSS/JS 404)
**Solution:**
```bash
# Rebuild assets
npm run build

# Verify manifest exists
cat public/build/manifest.json

# Check APP_ENV setting
grep APP_ENV .env  # Should be 'production'
```

### Issue: Database connection failed
**Solution:**
```bash
# Test database connection
php artisan tinker
# Then run: DB::connection()->getPdo();

# Verify .env database credentials
cat .env | grep DB_
```

### Issue: Storage link not working
**Solution:**
```bash
# Remove existing link
rm public/storage

# Recreate storage link
php artisan storage:link
```

---

## 17. Security Checklist

- [ ] `APP_DEBUG=false` in production
- [ ] Strong `APP_KEY` generated
- [ ] Database credentials are secure
- [ ] SSL certificate installed and active
- [ ] `.env` file is not in Git (verify `.gitignore`)
- [ ] File permissions set correctly (755 for directories, 644 for files)
- [ ] Storage and cache directories writable (775)
- [ ] Webroot points to `public` directory
- [ ] CSRF protection enabled (default in Laravel)
- [ ] SQL injection protection (use Eloquent/Query Builder)

---

## 18. Maintenance Commands

### Update Application
```bash
cd /home/XXXXX.cloudwaysapps.com/XXXXX/public_html
git pull origin main
composer install --optimize-autoloader --no-dev
npm ci --production=false
npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### View Logs
```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Clear old logs
echo "" > storage/logs/laravel.log
```

### Database Backup
```bash
# Export database
mysqldump -h HOST -P PORT -u USERNAME -p DATABASE_NAME > backup.sql

# Import database
mysql -h HOST -P PORT -u USERNAME -p DATABASE_NAME < backup.sql
```

---

## 19. Cloudways-Specific Notes

### No sudo Access
- Cloudways doesn't provide sudo access
- Use npm scripts directly: `./node_modules/.bin/vite build`
- Cannot install system packages

### Node.js Version
- Cloudways may run older Node.js versions (18.17.1)
- Vite 7 works but may show warnings
- Consider downgrading Vite if issues arise

### npm Cache Permissions
- npm cache may have permission issues
- Use `./node_modules/.bin/vite build` directly
- Or configure npm cache: `npm config set cache ~/.npm-cache`

---

## 20. Support and Resources

### Laravel Documentation
- https://laravel.com/docs/12.x

### Cloudways Documentation
- https://support.cloudways.com/

### Vite Documentation
- https://vitejs.dev/

### Inertia.js Documentation
- https://inertiajs.com/

---

## Summary

This deployment guide covered:
1. ✅ Server requirements and initial setup
2. ✅ GitHub integration with SSH keys
3. ✅ MySQL database configuration (replacing SQLite)
4. ✅ Environment configuration (.env setup)
5. ✅ Composer dependencies installation
6. ✅ Laravel application setup (migrations, keys, permissions)
7. ✅ Node.js and npm setup
8. ✅ Vite build process for frontend assets
9. ✅ Cache optimization and webroot configuration
10. ✅ SSL setup and deployment workflow
11. ✅ Troubleshooting and maintenance

Your JG Forms application should now be successfully deployed to Cloudways with MySQL database support!
