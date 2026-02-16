#!/bin/bash
set -e

echo "========================================="
echo "Building assets locally..."
echo "========================================="

cd /Users/Ruan/Herd/JoshGen/office-joshgen/jg-forms

# Build assets locally
npm run build

echo ""
echo "✅ Build completed!"
echo ""
echo "========================================="
echo "Uploading build files to server via SFTP..."
echo "========================================="

# Create SFTP batch file
cat > /tmp/sftp_upload.txt << 'EOF'
cd public_html
rm -rf public/build
mkdir public/build
lcd /Users/Ruan/Herd/JoshGen/office-joshgen/jg-forms/public/build
cd public/build
put -r *
bye
EOF

# Upload via SFTP
sshpass -p 'pEN%#nvlC$sESeBjcfGt2v$8' sftp -o StrictHostKeyChecking=no -oBatchMode=no -b /tmp/sftp_upload.txt officeftp@165.22.118.253

echo ""
echo "✅ Files uploaded successfully!"
echo ""
echo "========================================="
echo "Completing deployment on server..."
echo "========================================="
