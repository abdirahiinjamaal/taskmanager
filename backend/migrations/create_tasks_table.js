const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'taskmanager',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log
  }
);

const migration = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [statusIndex] = await sequelize.query(`SHOW INDEX FROM tasks WHERE Key_name = 'idx_tasks_status'`);
    if (statusIndex.length === 0) {
      await sequelize.query(`CREATE INDEX idx_tasks_status ON tasks(status)`);
    }

    const [priorityIndex] = await sequelize.query(`SHOW INDEX FROM tasks WHERE Key_name = 'idx_tasks_priority'`);
    if (priorityIndex.length === 0) {
      await sequelize.query(`CREATE INDEX idx_tasks_priority ON tasks(priority)`);
    }

    const [createdAtIndex] = await sequelize.query(`SHOW INDEX FROM tasks WHERE Key_name = 'idx_tasks_created_at'`);
    if (createdAtIndex.length === 0) {
      await sequelize.query(`CREATE INDEX idx_tasks_created_at ON tasks(created_at)`);
    }
    console.log('Migration completed successfully: tasks table created.');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migration();
