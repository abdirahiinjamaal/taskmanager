# Full Deployment Guide (AWS Console)

## Overview

| Component | AWS Service | Purpose |
|-----------|-------------|---------|
| Frontend | S3 | Hosts HTML/CSS/JS files |
| Backend | EC2 | Runs Node.js/Express API |
| Database | RDS MySQL | Stores task data |

---

## Step 1: Create RDS MySQL Database

### 1.1 Go to RDS

1. Open AWS Console: https://console.aws.amazon.com
2. Search for **RDS** in the top search bar
3. Click **RDS**

### 1.2 Create Database

1. Click **Create database**
2. Choose a database creation method: **Standard create**
3. Engine options: Select **MySQL**
4. Engine version: **MySQL 8.0.x**
5. Templates: Select **Free tier**
6. Settings:
   - DB instance identifier: `taskmanager-db`
   - Master username: `admin`
   - Master password: *(type a secure password)*
   - Confirm password: *(type again)*
7. Instance configuration:
   - DB instance class: **db.t3.micro** (free tier)
8. Storage:
   - Storage type: **General Purpose (SSD)**
   - Allocated storage: **20 GB**
   - Enable storage autoscaling: ✓
9. Connectivity:
   - Compute resource: **Don't connect to an EC2 compute resource**
   - Network type: **IPv4**
   - VPC: **Default VPC**
   - Publicly accessible: **Yes**
   - VPC security group: **Create new security group**
   - New security group name: `taskmanager-db-sg`
   - Availability Zone: **No preference**
10. Database authentication:
    - Authentication method: **Password authentication**
11. Additional configuration:
    - Initial database name: `taskmanager`
    - Backup retention period: **7 days**
    - Enable automated backups: ✓
12. Click **Create database**

### 1.3 Wait for Database

1. Wait for **Status** to change from **Creating** to **Available** (takes 5-10 minutes)
2. Click on the database name `taskmanager-db`
3. Under **Connectivity & security**, copy the **Endpoint**:
   - Example: `taskmanager-db.xxxxxx.us-east-1.rds.amazonaws.com`
4. Keep this endpoint - you'll need it later

### 1.4 Update Security Group

1. Go to **EC2** → **Security Groups** (in left sidebar)
2. Find `taskmanager-db-sg`
3. Click on it
4. Go to **Inbound rules** tab
5. Click **Edit inbound rules**
6. You should see a rule for MySQL/Aurora on port 3306
7. Change **Source** to `0.0.0.0/0` (or your EC2 security group for better security)
8. Click **Save rules**

---

## Step 2: Launch EC2 Backend Server

### 2.1 Go to EC2

1. Search for **EC2** in the top search bar
2. Click **EC2**

### 2.2 Launch Instance

1. Click **Launch Instance**
2. Name and tags:
   - Name: `taskmanager-backend`
3. Application and OS Images:
   - Search: **Amazon Linux**
   - Select: **Amazon Linux 2023**
4. Instance type:
   - Select: **t3.micro** (free tier eligible)
5. Key pair:
   - Click **Create new key pair**
   - Key pair name: `taskmanager-key`
   - Key pair type: **RSA**
   - Private key file format: **.pem**
   - Click **Create key pair**
   - **Save the downloaded .pem file** (you'll need it to connect)
6. Network settings:
   - Click **Edit**
   - Auto-assign public IP: **Enable**
   - Create security group: **Create security group**
   - Security group name: `taskmanager-ec2-sg`
   - Description: `Task Manager Backend`
   - Inbound rules:
     - Click **Add security group rule**
     - Type: **SSH**
     - Port: **22**
     - Source: **My IP**
     - Click **Add security group rule**
     - Type: **Custom TCP**
     - Port: **3000**
     - Source: **Anywhere-IPv4** (0.0.0.0/0)
7. Configure storage:
   - Size: **8 GiB**
   - Type: **gp3**
8. Click **Launch Instance**
9. Click **View all instances**
10. Wait for **Instance state** to become **Running**
11. Copy the **Public IPv4 address** (e.g., `54.xx.xx.xx`)

### 2.3 Connect to EC2

**On Windows (using PuTTY or PowerShell):**

```powershell
# PowerShell
ssh -i "C:\path\to\taskmanager-key.pem" ec2-user@your-ec2-public-ip
```

**On Mac/Linux:**

```bash
chmod 400 taskmanager-key.pem
ssh -i taskmanager-key.pem ec2-user@your-ec2-public-ip
```

When prompted: `Are you sure you want to continue connecting?` → Type `yes`

---

## Step 3: Setup Backend on EC2

### 3.1 Install Node.js

```bash
# Update packages
sudo yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify
node -v
npm -v
```

### 3.2 Install PM2

```bash
sudo npm install -g pm2
```

### 3.3 Clone Your Repository

```bash
cd ~
git clone https://github.com/yourusername/taskmanager.git
cd taskmanager/backend
```

*(Replace `yourusername` with your GitHub username)*

### 3.4 Configure Environment Variables

```bash
nano .env
```

Type this content (update the values):

```
DB_HOST=taskmanager-db.xxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=taskmanager
DB_USER=admin
DB_PASSWORD=your-password-here
DB_SSL=true
PORT=3000
NODE_ENV=production
```

**To save:** Press `Ctrl+O`, then `Enter`, then `Ctrl+X`

### 3.5 Install Dependencies

```bash
npm install --production
```

### 3.6 Run Database Migration

```bash
npm run migrate
```

You should see: `Migration completed successfully: tasks table created.`

### 3.7 Start the Application

```bash
pm2 start server.js --name taskmanager
```

### 3.8 Save PM2 Configuration

```bash
pm2 save
pm2 startup
```

Follow the instruction that appears (copy and run the command it shows).

### 3.9 Verify Backend

```bash
# Check PM2 status
pm2 status

# Test API
curl http://localhost:3000/api/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### 3.10 Test from Your Browser

Open a new browser tab and go to:
```
http://your-ec2-public-ip:3000/api/health
```

You should see the health check response.

---

## Step 4: Deploy Frontend to S3

### 4.1 Create S3 Bucket

1. Search for **S3** in the top search bar
2. Click **S3**
3. Click **Create bucket**
4. Bucket settings:
   - Bucket name: `taskmanager-frontend-youraccount` *(must be globally unique)*
   - AWS Region: **us-east-1** (N. Virginia)
5. Block Public Access settings:
   - **Uncheck** "Block all public access"
   - Acknowledge the warning: ✓
6. Bucket Versioning: **Disable**
7. Default encryption: **Enable** (AES-256)
8. Click **Create bucket**

### 4.2 Enable Static Website Hosting

1. Click on your bucket name
2. Go to **Properties** tab
3. Scroll down to **Static website hosting**
4. Click **Edit**
5. Static website hosting: **Enable**
6. Index document: `index.html`
7. Error document: `index.html`
8. Click **Save changes**
9. Copy the **Bucket website endpoint** (e.g., `http://taskmanager-frontend-xxx.s3-website-us-east-1.amazonaws.com`)

### 4.3 Set Bucket Policy

1. Go to **Permissions** tab
2. Scroll to **Bucket policy**
3. Click **Edit**
4. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

5. Click **Save changes**

### 4.4 Upload Frontend Files

1. Go to **Objects** tab
2. Click **Upload**
3. Click **Add files**
4. Select all files from your local `frontend/` folder:
   - `index.html`
   - `css/styles.css`
   - `js/app.js`
5. Click **Upload**
6. Wait for **Upload succeeded** message

### 4.5 Test Frontend

Open the Bucket website endpoint URL from Step 4.2 in your browser.

---

## Step 5: Connect Frontend to Backend

### 5.1 Update Frontend API URL

On your **local computer**, edit `frontend/js/app.js`:

Find this line:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

Change to:
```javascript
const API_BASE_URL = 'http://your-ec2-public-ip:3000/api';
```

*(Replace `your-ec2-public-ip` with your actual EC2 IP)*

### 5.2 Re-upload to S3

1. Go to S3 → your bucket
2. Click **Upload**
3. Upload the updated `app.js` file
4. (Or delete old files and re-upload all)

### 5.3 Test Full Application

1. Open your frontend URL
2. You should see the Task Manager dashboard
3. Click **Add Task**
4. Create a task
5. Task should appear in the list
6. Test: complete, edit, delete, filter, search

---

## Step 6: (Optional) Add CloudFront CDN

### 6.1 Create Distribution

1. Search for **CloudFront** in the top search bar
2. Click **CloudFront**
3. Click **Create distribution**
4. Settings:
   - Origin domain: Click and select your S3 bucket
   - Name: `taskmanager-frontend`
   - Viewer protocol policy: **Redirect HTTP to HTTPS**
   - Allowed HTTP methods: **GET, HEAD**
   - Cache policy: **CachingOptimized**
   - Default root object: `index.html`
5. Click **Create distribution**
6. Wait for **Status** to become **Deployed** (10-20 minutes)
7. Copy the **Distribution domain name** (e.g., `d1234abcdef.cloudfront.net`)

### 6.2 Use CloudFront URL

Instead of the S3 URL, use your CloudFront URL:
```
https://d1234abcdef.cloudfront.net
```

---

## Step 7: (Optional) Add Custom Domain

### 7.1 Request SSL Certificate

1. Search for **Certificate Manager**
2. Click **Request a certificate**
3. Select **Request a public certificate**
4. Click **Next**
5. Domain name: `yourdomain.com`
6. Validation method: **DNS validation**
7. Click **Request**
8. Go to the certificate → Click **Create records in Route 53**
9. Wait for **Status** to become **Issued**

### 7.2 Update CloudFront

1. Go to CloudFront → Your distribution → **Edit**
2. Alternate domain name: Add `yourdomain.com`
3. Custom SSL certificate: Select your certificate
4. Click **Save changes**

### 7.3 Update Route 53

1. Go to **Route 53**
2. Click **Hosted zones**
3. Click on your domain
4. Click **Create record**
5. Record name: *(leave blank for root domain)*
6. Record type: **A - IPv4**
7. Toggle **Alias** to on
8. Route traffic to: **CloudFront distributions**
9. Select your distribution
10. Click **Create records**

---

## Update the Application

### Backend Updates

1. SSH into EC2:
   ```bash
   ssh -i taskmanager-key.pem ec2-user@your-ec2-ip
   ```

2. Pull latest code:
   ```bash
   cd ~/taskmanager/backend
   git pull
   ```

3. Install any new dependencies:
   ```bash
   npm install --production
   ```

4. Restart app:
   ```bash
   pm2 restart taskmanager
   ```

### Frontend Updates

1. Edit files on your local computer
2. Go to S3 → your bucket
3. Upload updated files (or delete and re-upload)
4. If using CloudFront, go to CloudFront → Invalidations → Create invalidation → Type `/*` → Invalidate

---

## Architecture

```
         USER
           │
           ▼
    ┌──────────────┐
    │  CloudFront  │  (CDN - optional)
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   S3 Bucket  │  (Frontend files)
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   EC2 Instance│  (Backend API)
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  RDS MySQL   │  (Database)
    └──────────────┘
```

---

## Costs (Monthly)

| Service | Cost |
|---------|------|
| EC2 t3.micro | ~$8.50 |
| RDS db.t3.micro | ~$12.50 |
| S3 | ~$0.01 |
| CloudFront | ~$0.50 |
| **Total** | **~$21/month** |

Free tier covers first 12 months.

---

## Troubleshooting

### Frontend shows "Failed to load tasks"

1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Check the error message
4. Common fixes:
   - API URL is wrong → Update `app.js`
   - EC2 security group doesn't allow port 3000
   - Backend is not running → SSH and run `pm2 status`

### "Connection refused" error

1. Check EC2 is running: EC2 → Instances → Status should be **Running**
2. Check security group allows port 3000
3. Check PM2 is running: `pm2 status`
4. Check logs: `pm2 logs taskmanager`

### Tasks not saving to database

1. Check RDS is **Available**: RDS → Databases → Status
2. Check `.env` has correct RDS endpoint
3. Check RDS security group allows port 3306
4. Test connection from EC2:
   ```bash
   mysql -h your-rds-endpoint -u admin -p
   ```

### S3 website shows 403 Forbidden

1. Check bucket policy allows public read
2. Check "Block all public access" is off
3. Check static website hosting is enabled

### S3 website shows 404

1. Check `index.html` is uploaded
2. Check index document is set to `index.html`

---

## Cleanup

### Delete EC2 Instance

1. EC2 → Instances
2. Select instance → **Instance state** → **Terminate instance**

### Delete RDS

1. RDS → Databases
2. Select database → **Actions** → **Delete**
3. Type `delete me` to confirm
4. Click **Delete**

### Delete S3 Bucket

1. S3 → Buckets
2. Select bucket → **Empty** → Type bucket name → **Permanently delete**
3. Select bucket → **Delete** → Type bucket name → **Delete bucket**

### Delete CloudFront

1. CloudFront → Distributions
2. Select distribution → **Disable**
3. Wait 10-15 minutes
4. Select distribution → **Delete**

---

## Quick Reference

| Item | Value |
|------|-------|
| Frontend URL | `http://taskmanager-frontend-xxx.s3-website-us-east-1.amazonaws.com` |
| Backend URL | `http://your-ec2-ip:3000/api` |
| API Health | `http://your-ec2-ip:3000/api/health` |
| RDS Endpoint | `taskmanager-db.xxxxxx.us-east-1.rds.amazonaws.com` |
| SSH Command | `ssh -i taskmanager-key.pem ec2-user@your-ec2-ip` |
