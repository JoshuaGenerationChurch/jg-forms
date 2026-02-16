#!/usr/bin/expect -f
set timeout 120

spawn ssh -o StrictHostKeyChecking=no officeftp@165.22.118.253
expect "password:"
send "pEN%#nvlC\$sESeBjcfGt2v\$8\r"
expect "$ "

# Check current directory contents
send "pwd\r"
expect "$ "
send "ls -la\r"
expect "$ "

# Check if this is a Laravel app
send "ls -la composer.json 2>/dev/null || echo 'No composer.json found'\r"
expect "$ "

# Check if git repo exists
send "ls -la .git 2>/dev/null || echo 'No .git directory'\r"
expect "$ "

send "exit\r"
expect eof
