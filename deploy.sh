#!/bin/bash

set -e

# ==========================================
# 1. Install Node.js 20
# ==========================================
sudo curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
sudo dnf install -y nodejs git

# Verify
node --version
npm --version

# ==========================================
# 2. Install PM2
# ==========================================
sudo npm install -g pm2

# ==========================================
# 3. Clone application
# ==========================================
sudo cd /opt

sudo git clone https://github.com/abdirahiinjamaal/taskmanager.git

sudo cd /opt/taskmanager/backend

# ==========================================
# 4. Create .env
# ==========================================
sudo cat > .env <<'EOF'
DB_HOST=taskmanager.ciheysy2ems5.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=taskmanager
DB_USER=admin
DB_PASSWORD=taskmanager
DB_SSL=false

PORT=8080
NODE_ENV=production
EOF

# Protect .env
sudo chmod 600 .env

# ==========================================
# 5. Install backend dependencies
# ==========================================
sudo npm install --production

# ==========================================
# 6. Run database migration
# ==========================================
sudo npm run migrate

# ==========================================
# 7. Start backend with PM2
# ==========================================
sudo pm2 start server.js --name taskmanager

# Save PM2 process list
pm2 save

# Configure PM2 to start on boot
pm2 startup systemd -u root --hp /root

# ==========================================
# 8. Enable PM2 service
# ==========================================
systemctl enable pm2-root
systemctl start pm2-root

# ==========================================
# 9. Show status
# ==========================================
pm2 status