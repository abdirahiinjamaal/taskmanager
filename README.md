# Task Manager Dashboard

A full-stack task management application with a modern, responsive dashboard UI.

## Project Structure

```
taskmanager/
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   └── taskController.js    # Task CRUD operations
│   ├── migrations/
│   │   └── create_tasks_table.js # Database migration script
│   ├── routes/
│   │   └── tasks.js             # API routes
│   ├── .env.example             # Environment variables template
│   ├── package.json             # Backend dependencies
│   └── server.js                # Express server entry point
└── frontend/
    ├── css/
    │   └── styles.css           # Application styles
    ├── js/
    │   └── app.js               # Frontend JavaScript
    └── index.html               # Dashboard UI
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ (or AWS RDS PostgreSQL)

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskmanager
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
PORT=3000
```

### 3. Run Database Migration

```bash
npm run migrate
```

### 4. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000/api`

## Frontend Setup

### 1. Serve the Frontend

You can use any static file server:

```bash
# Using Python
cd frontend
python -m http.server 8080

# Using Node.js (npx)
npx serve frontend -p 8080

# Using VS Code Live Server extension
```

### 2. Update API URL (if needed)

Edit `frontend/js/app.js` and update the `API_BASE_URL` if your backend runs on a different port or domain:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | Get all tasks (supports `?status=`, `?priority=`, `?search=`) |
| GET | /api/tasks/:id | Get single task |
| POST | /api/tasks | Create new task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| PATCH | /api/tasks/:id/status | Update task status only |

### Task Schema

```json
{
  "id": 1,
  "title": "My Task",
  "description": "Task description",
  "status": "pending|in_progress|completed",
  "priority": "low|medium|high",
  "due_date": "2024-01-15T10:00:00Z",
  "created_at": "2024-01-10T08:00:00Z",
  "updated_at": "2024-01-10T08:00:00Z"
}
```

## AWS Deployment

### EC2 Deployment

1. Launch an EC2 instance with Amazon Linux 2 or Ubuntu
2. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. Copy backend files to EC2:
   ```bash
   scp -i your-key.pem -r backend/ ec2-user@your-ec2-ip:~/
   scp -i your-key.pem -r frontend/ ec2-user@your-ec2-ip:~/
   ```

4. SSH into EC2 and install dependencies:
   ```bash
   cd ~/backend
   npm install --production
   ```

5. Configure `.env` with your RDS credentials:
   ```env
   DB_HOST=your-rds-endpoint.amazonaws.com
   DB_PORT=5432
   DB_NAME=taskmanager
   DB_USER=admin
   DB_PASSWORD=your-rds-password
   DB_SSL=true
   PORT=3000
   ```

6. Run migration:
   ```bash
   npm run migrate
   ```

7. Start with PM2 (recommended):
   ```bash
   npm install -g pm2
   pm2 start server.js --name taskmanager
   pm2 save
   pm2 startup
   ```

### RDS Setup

1. Create a PostgreSQL RDS instance in AWS Console
2. Configure security group to allow EC2 access on port 5432
3. Create database `taskmanager` in the RDS instance
4. Update backend `.env` with RDS endpoint and credentials

## Features

- Create, read, update, delete tasks
- Filter tasks by status and priority
- Search tasks by title/description
- Mark tasks as complete/incomplete
- Responsive dashboard with stats
- Dark mode UI
- Toast notifications
- Keyboard shortcuts (Escape to close modal)

## License

MIT
