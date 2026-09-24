const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const replacements = {};

    if (status) {
      query += ' AND status = :status';
      replacements.status = status;
    }

    if (priority) {
      query += ' AND priority = :priority';
      replacements.priority = priority;
    }

    if (search) {
      query += ' AND (LOWER(title) LIKE LOWER(:search) OR LOWER(description) LIKE LOWER(:search))';
      replacements.search = `%${search}%`;
    }

    query += ' ORDER BY created_at DESC';

    const tasks = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const tasks = await sequelize.query(
      'SELECT * FROM tasks WHERE id = :id',
      {
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(tasks[0]);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    await sequelize.query(
      `INSERT INTO tasks (title, description, status, priority, due_date)
       VALUES (:title, :description, :status, :priority, :due_date)`,
      {
        replacements: {
          title,
          description: description || null,
          status: status || 'pending',
          priority: priority || 'medium',
          due_date: due_date || null
        },
        type: QueryTypes.INSERT
      }
    );

    const newTask = await sequelize.query(
      'SELECT * FROM tasks WHERE id = LAST_INSERT_ID()',
      { type: QueryTypes.SELECT }
    );

    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date } = req.body;

    const [affectedRows] = await sequelize.query(
      `UPDATE tasks 
       SET title = :title, 
           description = :description, 
           status = :status, 
           priority = :priority, 
           due_date = :due_date,
           updated_at = NOW()
       WHERE id = :id`,
      {
        replacements: {
          id,
          title,
          description: description || null,
          status: status || 'pending',
          priority: priority || 'medium',
          due_date: due_date || null
        },
        type: QueryTypes.UPDATE
      }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await sequelize.query(
      'SELECT * FROM tasks WHERE id = :id',
      {
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );

    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const [affectedRows] = await sequelize.query(
      'DELETE FROM tasks WHERE id = :id',
      {
        replacements: { id },
        type: QueryTypes.DELETE
      }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [affectedRows] = await sequelize.query(
      `UPDATE tasks 
       SET status = :status, updated_at = NOW()
       WHERE id = :id`,
      {
        replacements: { id, status },
        type: QueryTypes.UPDATE
      }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await sequelize.query(
      'SELECT * FROM tasks WHERE id = :id',
      {
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );

    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
};
