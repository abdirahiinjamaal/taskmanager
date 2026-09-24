#!/bin/bash


# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

#install pm2
sudo npm install -g pm2

# Clone your repo
cd ~
git clone https://github.com/yourusername/taskmanager.git
cd taskmanager/backend

# Configure environment
nano .env

#.env content:
#DB_HOST=your-rds-endpoint.amazonaws.com
#DB_PORT=3306
#DB_NAME=taskmanager
#DB_USER=admin
#DB_PASSWORD=yourpassword
#DB_SSL=true
#PORT=3000
#NODE_ENV=production

# Install dependencies
npm install --production

# Run migration
npm run migrate


# Start app
pm2 start server.js --name taskmanager
pm2 save
pm2 startup


#to update letter
cd ~/taskmanager/backend
git pull
npm install --production
pm2 restart taskmanager