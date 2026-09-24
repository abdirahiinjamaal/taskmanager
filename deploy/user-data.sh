#!/bin/bash
set -e

# ============================================
# Task Manager - EC2 User Data Script
# ============================================

LOG=/var/log/user-data.log
exec > >(tee -a $LOG) 2>&1

echo "========================================="
echo "  Starting Task Manager Setup"
echo "  $(date)"
echo "========================================="

# Update system
echo "[1/9] Updating system..."
sudo yum update -y

# Install Node.js 20
echo "[2/9] Installing Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify Node
echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"

# Install PM2
echo "[3/9] Installing PM2..."
sudo npm install -g pm2

# Install git
echo "[4/9] Installing git..."
sudo yum install -y git

# Clone repo
echo "[5/9] Cloning repository..."
sudo rm -rf /opt/taskmanager
sudo git clone https://github.com/abdirahiinjamaal/taskmanager.git /opt/taskmanager
sudo chown -R ec2-user:ec2-user /opt/taskmanager

# Create .env
echo "[6/9] Creating .env file..."
cat > /opt/taskmanager/backend/.env << 'EOF'
DB_HOST=taskmanager.ciheysy2ems5.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=taskmanager
DB_USER=admin
DB_PASSWORD=taskmanager
DB_SSL=false
PORT=8080
NODE_ENV=production
EOF

# Install dependencies
echo "[7/9] Installing dependencies..."
cd /opt/taskmanager/backend
sudo npm install --production

# Run migration
echo "[8/9] Running migration..."
sudo npm run migrate

# Start with PM2
echo "[9/9] Starting application..."
pm2 delete taskmanager 2>/dev/null || true
pm2 start server.js --name taskmanager
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user | tail -1 | sudo bash

echo ""
echo "========================================="
echo "  Setup Complete!"
echo "  $(date)"
echo "========================================="
echo "  API: http://localhost:8080/api/health"
echo "========================================="
