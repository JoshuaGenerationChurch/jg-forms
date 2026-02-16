# WebAuthn Passkey Deployment - Final Steps

## ✅ Completed
- ✅ Frontend assets built and deployed
- ✅ User model updated with WebauthnAuthenticatable trait
- ✅ Routes added for WebAuthn endpoints
- ✅ Code committed and pushed to GitHub

## 🔧 Final Steps Required (Run on Production Server)

SSH into your production server and run these commands:

```bash
ssh officeftp@165.22.118.253
cd /home/1197962.cloudwaysapps.com/hczbsjjmgr/public_html
```

### 1. Pull Latest Code
```bash
git pull origin main
```

### 2. Publish WebAuthn Configuration and Migrations
```bash
php artisan vendor:publish --provider="LaravelWebauthn\ServiceProvider"
```

### 3. Run Migrations
```bash
php artisan migrate --force
```

This will create the `webauthn_keys` table to store user passkey credentials.

### 4. Clear Caches
```bash
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
```

### 5. Update Environment Variables (if needed)
Edit `.env` and ensure these are set:
```bash
APP_URL=https://office.joshgen.org
WEBAUTHN_RP_ID=office.joshgen.org
WEBAUTHN_RP_NAME="JoshGen Office"
```

If you update .env, run:
```bash
php artisan config:cache
```

## 🧪 Testing

1. Visit https://office.joshgen.org/login
2. On a device with Touch ID/Face ID/Windows Hello, you should see "Sign in with Passkey" button
3. Login with your existing password first
4. Go to https://office.joshgen.org/settings/passkeys
5. Register a new passkey
6. Logout and try signing in with the passkey

## 🎉 Complete!

Once these steps are done, your passkey authentication will be fully functional!

## Troubleshooting

### "Table already exists" error
If the webauthn_keys table already exists, skip step 3.

### Passkey button doesn't appear
- Ensure HTTPS is enabled (required for WebAuthn)
- Check browser console for JavaScript errors
- Verify device supports platform authenticator (Touch ID, Face ID, etc.)

### Login fails
- Check Laravel logs: `tail -f storage/logs/laravel.log`
- Ensure WEBAUTHN_RP_ID matches your domain exactly
- Clear browser cache and try again
