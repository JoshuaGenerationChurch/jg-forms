#!/usr/bin/expect -f
set timeout 300

spawn ssh -o StrictHostKeyChecking=no officeftp@165.22.118.253
expect "password:"
send "pEN%#nvlC\$sESeBjcfGt2v\$8\r"
expect "$ "

puts "\n========================================\n"
puts "STEP 1: Pulling latest code from GitHub\n"
puts "========================================\n"

send "cd ~/public_html\r"
expect "$ "

send "git fetch origin\r"
expect "$ "

send "git status\r"
expect "$ "

send "git pull origin main\r"
expect {
    "Already up to date" { puts "\n✅ Code is already up to date\n" }
    "Updating" { puts "\n✅ Code pulled successfully\n" }
    timeout { puts "\n❌ Git pull timeout\n" }
}
expect "$ "

puts "\n========================================\n"
puts "STEP 2: Installing Composer dependencies\n"
puts "========================================\n"

send "composer install --optimize-autoloader --no-dev\r"
expect {
    "Generating optimized autoload files" { puts "\n✅ Composer dependencies installed\n" }
    timeout { puts "\n❌ Composer install timeout\n" }
}
expect "$ "

puts "\n========================================\n"
puts "STEP 3: Checking .env configuration\n"
puts "========================================\n"

send "cat .env | grep -E '(APP_ENV|APP_KEY|DB_CONNECTION)'\r"
expect "$ "

puts "\n========================================\n"
puts "STEP 4: Installing npm dependencies\n"
puts "========================================\n"

send "npm ci --production=false\r"
expect {
    "added" { puts "\n✅ NPM dependencies installed\n" }
    "up to date" { puts "\n✅ NPM dependencies already up to date\n" }
    timeout { puts "\n❌ NPM install timeout\n" }
}
expect "$ "

puts "\n========================================\n"
puts "STEP 5: Building frontend assets with Vite\n"
puts "========================================\n"

send "npm run build\r"
expect {
    "built in" { puts "\n✅ Frontend assets built successfully\n" }
    timeout { puts "\n❌ Build timeout\n" }
}
expect "$ "

puts "\n========================================\n"
puts "STEP 6: Checking build output\n"
puts "========================================\n"

send "ls -la public/build/\r"
expect "$ "

send "ls -la public/build/manifest.json\r"
expect "$ "

puts "\n========================================\n"
puts "STEP 7: Setting storage permissions\n"
puts "========================================\n"

send "chmod -R 775 storage bootstrap/cache\r"
expect "$ "

puts "\n========================================\n"
puts "STEP 8: Creating storage link\n"
puts "========================================\n"

send "php artisan storage:link\r"
expect "$ "

puts "\n========================================\n"
puts "STEP 9: Running database migrations\n"
puts "========================================\n"

send "php artisan migrate --force\r"
expect {
    "Nothing to migrate" { puts "\n✅ Database is up to date\n" }
    "Migrated" { puts "\n✅ Migrations completed\n" }
    "could not find driver" { puts "\n❌ Database driver error\n" }
    timeout { puts "\n❌ Migration timeout\n" }
}
expect "$ "

puts "\n========================================\n"
puts "STEP 10: Caching Laravel configuration\n"
puts "========================================\n"

send "php artisan config:clear\r"
expect "$ "

send "php artisan config:cache\r"
expect "$ "

send "php artisan route:cache\r"
expect "$ "

send "php artisan view:cache\r"
expect "$ "

puts "\n========================================\n"
puts "STEP 11: Verifying deployment\n"
puts "========================================\n"

send "php artisan --version\r"
expect "$ "

send "php artisan about\r"
expect "$ "

puts "\n========================================\n"
puts "✅ DEPLOYMENT COMPLETED!\n"
puts "========================================\n"

send "exit\r"
expect eof
