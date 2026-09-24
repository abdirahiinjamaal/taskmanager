const API_BASE_URL = 'http://localhost:3000/api';

let tasks = [];
let currentFilter = 'all';
let currentPriorityFilter = '';
let searchQuery = '';

const dom = {
  tasksList: document.getElementById('tasksList'),
  emptyState: document.getElementById('emptyState'),
  taskModal: document.getElementById('taskModal'),
  taskForm: document.getElementById('taskForm'),
  taskId: document.getElementById('taskId'),
  taskTitle: document.getElementById('taskTitle'),
  taskDescription: document.getElementById('taskDescription'),
  taskStatus: document.getElementById('taskStatus'),
  taskPriority: document.getElementById('taskPriority'),
  taskDueDate: document.getElementById('taskDueDate'),
  modalTitle: document.getElementById('modalTitle'),
  submitBtn: document.getElementById('submitBtn'),
  addTaskBtn: document.getElementById('addTaskBtn'),
  closeModal: document.getElementById('closeModal'),
  cancelBtn: document.getElementById('cancelBtn'),
  searchInput: document.getElementById('searchInput'),
  priorityFilter: document.getElementById('priorityFilter'),
  menuToggle: document.getElementById('menuToggle'),
  sidebar: document.querySelector('.sidebar'),
  pageTitle: document.getElementById('pageTitle'),
  toastContainer: document.getElementById('toastContainer'),
  statTotal: document.getElementById('statTotal'),
  statPending: document.getElementById('statPending'),
  statInProgress: document.getElementById('statInProgress'),
  statCompleted: document.getElementById('statCompleted'),
  badgeAll: document.getElementById('badge-all'),
  badgePending: document.getElementById('badge-pending'),
  badgeInProgress: document.getElementById('badge-in_progress'),
  badgeCompleted: document.getElementById('badge-completed'),
  connectionStatus: document.getElementById('connectionStatus')
};

const api = {
  async getTasks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/tasks?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  async createTask(task) {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  async updateTask(id, task) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  async updateTaskStatus(id, status) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update task status');
    return response.json();
  },

  async deleteTask(id) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete task');
    return response.json();
  }
};

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' 
        ? '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
      }
    </svg>
    <span class="toast-message">${message}</span>
  `;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const formatted = date.toLocaleDateString('en-US', options);

  if (diffDays < 0) return `Overdue - ${formatted}`;
  if (diffDays === 0) return `Today - ${formatted}`;
  if (diffDays === 1) return `Tomorrow - ${formatted}`;
  return formatted;
}

function isOverdue(dateString) {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

function updateStats() {
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;

  dom.statTotal.textContent = total;
  dom.statPending.textContent = pending;
  dom.statInProgress.textContent = inProgress;
  dom.statCompleted.textContent = completed;

  dom.badgeAll.textContent = total;
  dom.badgePending.textContent = pending;
  dom.badgeInProgress.textContent = inProgress;
  dom.badgeCompleted.textContent = completed;
}

function renderTasks() {
  let filteredTasks = [...tasks];

  if (currentFilter !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.status === currentFilter);
  }

  if (currentPriorityFilter) {
    filteredTasks = filteredTasks.filter(t => t.priority === currentPriorityFilter);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredTasks = filteredTasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query))
    );
  }

  if (filteredTasks.length === 0) {
    dom.tasksList.innerHTML = '';
    dom.tasksList.appendChild(dom.emptyState);
    dom.emptyState.style.display = 'flex';
    return;
  }

  dom.emptyState.style.display = 'none';

  dom.tasksList.innerHTML = filteredTasks.map(task => `
    <div class="task-card ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" onclick="toggleTaskStatus(${task.id}, '${task.status}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
      </div>
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="task-badge status-${task.status}">${formatStatus(task.status)}</span>
          <span class="task-badge priority-${task.priority}">${task.priority}</span>
          ${task.due_date ? `
            <span class="task-due ${isOverdue(task.due_date) && task.status !== 'completed' ? 'overdue' : ''}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              ${formatDate(task.due_date)}
            </span>
          ` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action-btn" onclick="editTask(${task.id})" title="Edit">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="task-action-btn delete" onclick="deleteTask(${task.id})" title="Delete">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatStatus(status) {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function loadTasks() {
  try {
    tasks = await api.getTasks();
    updateStats();
    renderTasks();
    updateConnectionStatus(true);
  } catch (error) {
    console.error('Failed to load tasks:', error);
    showToast('Failed to load tasks. Please check your connection.', 'error');
    updateConnectionStatus(false);
  }
}

function updateConnectionStatus(connected) {
  const statusDot = dom.connectionStatus.querySelector('.status-dot');
  const statusText = dom.connectionStatus.querySelector('span:last-child');
  
  if (connected) {
    statusDot.style.background = 'var(--success)';
    statusText.textContent = 'Connected to API';
  } else {
    statusDot.style.background = 'var(--danger)';
    statusText.textContent = 'Disconnected';
  }
}

async function toggleTaskStatus(id, currentStatus) {
  const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  try {
    const updatedTask = await api.updateTaskStatus(id, newStatus);
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = updatedTask;
    }
    updateStats();
    renderTasks();
    showToast(`Task marked as ${formatStatus(newStatus).toLowerCase()}`);
  } catch (error) {
    console.error('Failed to update task status:', error);
    showToast('Failed to update task status', 'error');
  }
}

function openModal(task = null) {
  dom.taskForm.reset();
  
  if (task) {
    dom.modalTitle.textContent = 'Edit Task';
    dom.submitBtn.textContent = 'Update Task';
    dom.taskId.value = task.id;
    dom.taskTitle.value = task.title;
    dom.taskDescription.value = task.description || '';
    dom.taskStatus.value = task.status;
    dom.taskPriority.value = task.priority;
    if (task.due_date) {
      const date = new Date(task.due_date);
      dom.taskDueDate.value = date.toISOString().slice(0, 16);
    }
  } else {
    dom.modalTitle.textContent = 'Create New Task';
    dom.submitBtn.textContent = 'Create Task';
    dom.taskId.value = '';
  }

  dom.taskModal.classList.add('active');
  setTimeout(() => dom.taskTitle.focus(), 100);
}

function closeModal() {
  dom.taskModal.classList.remove('active');
  dom.taskForm.reset();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) openModal(task);
}

async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    await api.deleteTask(id);
    tasks = tasks.filter(t => t.id !== id);
    updateStats();
    renderTasks();
    showToast('Task deleted successfully');
  } catch (error) {
    console.error('Failed to delete task:', error);
    showToast('Failed to delete task', 'error');
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const taskData = {
    title: dom.taskTitle.value.trim(),
    description: dom.taskDescription.value.trim(),
    status: dom.taskStatus.value,
    priority: dom.taskPriority.value,
    due_date: dom.taskDueDate.value || null
  };

  const id = dom.taskId.value;

  try {
    if (id) {
      const updatedTask = await api.updateTask(id, taskData);
      const index = tasks.findIndex(t => t.id === parseInt(id));
      if (index !== -1) {
        tasks[index] = updatedTask;
      }
      showToast('Task updated successfully');
    } else {
      const newTask = await api.createTask(taskData);
      tasks.unshift(newTask);
      showToast('Task created successfully');
    }

    updateStats();
    renderTasks();
    closeModal();
  } catch (error) {
    console.error('Failed to save task:', error);
    showToast('Failed to save task', 'error');
  }
}

function setActiveFilter(filter) {
  currentFilter = filter;
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.filter === filter);
  });

  const titles = {
    all: 'All Tasks',
    pending: 'Pending Tasks',
    in_progress: 'In Progress Tasks',
    completed: 'Completed Tasks'
  };
  dom.pageTitle.textContent = titles[filter] || 'All Tasks';

  renderTasks();
}

function initEventListeners() {
  dom.addTaskBtn.addEventListener('click', () => openModal());
  dom.closeModal.addEventListener('click', closeModal);
  dom.cancelBtn.addEventListener('click', closeModal);
  dom.taskForm.addEventListener('submit', handleFormSubmit);

  dom.taskModal.addEventListener('click', (e) => {
    if (e.target === dom.taskModal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.taskModal.classList.contains('active')) {
      closeModal();
    }
  });

  dom.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTasks();
  });

  dom.priorityFilter.addEventListener('change', (e) => {
    currentPriorityFilter = e.target.value;
    renderTasks();
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      setActiveFilter(item.dataset.filter);
    });
  });

  dom.menuToggle.addEventListener('click', () => {
    dom.sidebar.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        dom.sidebar.classList.contains('active') && 
        !dom.sidebar.contains(e.target) && 
        e.target !== dom.menuToggle) {
      dom.sidebar.classList.remove('active');
    }
  });
}

async function init() {
  initEventListeners();
  await loadTasks();
}

document.addEventListener('DOMContentLoaded', init);
