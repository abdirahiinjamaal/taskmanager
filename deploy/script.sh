#!/bin/bash
set -e

LOG=/var/log/user-data.log
exec > >(tee -a $LOG) 2>&1

echo "========================================="
echo "  Task Manager Setup"
echo "  $(date)"
echo "========================================="

echo "[1/8] Updating system..."
sudo yum update -y

echo "[2/8] Installing Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

echo "[3/8] Installing PM2..."
sudo npm install -g pm2

echo "[4/8] Installing git..."
sudo yum install -y git

echo "[5/8] Cloning repository..."
sudo rm -rf /opt/taskmanager
sudo git clone https://github.com/abdirahiinjamaal/taskmanager.git /opt/taskmanager
sudo chown -R ec2-user:ec2-user /opt/taskmanager

echo "[6/8] Creating .env file..."
echo "DB_HOST=taskmanager.ciheysy2ems5.us-east-1.rds.amazonaws.com" | sudo tee /opt/taskmanager/backend/.env > /dev/null
echo "DB_PORT=3306" | sudo tee -a /opt/taskmanager/backend/.env > /dev/null
echo "DB_NAME=taskmanager" | sudo tee -a /opt/taskmanager/backend/.env > /dev/null
echo "DB_USER=admin" | sudo tee -a /opt/taskmanager/backend/.env > /dev/null
echo "DB_PASSWORD=taskmanager" | sudo tee -a /opt/taskmanager/backend/.env > /dev/null
echo "DB_SSL=false" | sudo tee -a /opt/taskmanager/backend/.env > /dev/null
echo "PORT=8080" | sudo tee -a /opt/taskmanager/backend/.env > /dev/null
echo "NODE_ENV=production" | sudo tee -a /opt/taskmanager/backend/.env > /dev/null

echo "[7/8] Installing dependencies..."
cd /opt/taskmanager/backend
sudo npm install --production

echo "[8/8] Running migration and starting app..."
sudo npm run migrate
pm2 delete taskmanager 2>/dev/null || true
pm2 start server.js --name taskmanager
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user | tail -1 | sudo bash

echo ""
echo "========================================="
echo "  Done! $(date)"
echo "========================================="
