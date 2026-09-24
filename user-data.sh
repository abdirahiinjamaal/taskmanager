#!/bin/bash
set -e

# Update system
echo "[1/9] Updating system..."
sudo yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify Node
node -v
npm -v

# Install PM2
sudo npm install -g pm2

# Install git
sudo yum install -y git

# Clone repo
sudo rm -rf /opt/taskmanager
sudo git clone https://github.com/abdirahiinjamaal/taskmanager.git /opt/taskmanager
sudo chown -R ec2-user:ec2-user /opt/taskmanager

# Create .env
cat > /opt/taskmanager/backend/.env << 'EOF'
DB_HOST=rds endpoint
DB_PORT=3306
DB_NAME=dbname
DB_USER=admin
DB_PASSWORD=password
DB_SSL=false
PORT=8080
NODE_ENV=production
EOF

# Install dependencies
cd /opt/taskmanager/backend
sudo npm install --production

# Run migration
sudo npm run migrate

# Start with PM2
pm2 delete taskmanager 2>/dev/null || true
pm2 start server.js --name taskmanager
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user | tail -1 | sudo bash

