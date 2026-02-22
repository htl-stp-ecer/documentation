---
title: "Building Your First Application"
date: 2024-01-15
draft: false
---

# Building Your First Application

In this tutorial, you'll learn how to build a complete application from scratch.

## What You'll Build

A simple todo application with the following features:

- Create new tasks
- Mark tasks as complete
- Delete tasks
- Filter by status

## Prerequisites

- Completed the [Getting Started](/00-docs/00-getting-started/) guide
- Basic knowledge of JavaScript
- A code editor (VS Code recommended)

## Step 1: Project Setup

Create a new project directory:

```bash
mkdir todo-app
cd todo-app
binary init
```

## Step 2: Create the Data Model

Create a file called `models/task.js`:

```javascript
class Task {
  constructor(title, completed = false) {
    this.id = Date.now().toString();
    this.title = title;
    this.completed = completed;
    this.createdAt = new Date();
  }

  toggle() {
    this.completed = !this.completed;
  }
}

module.exports = Task;
```

## Step 3: Build the UI

Create `views/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Todo App</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="container">
    <h1>My Todo List</h1>
    <form id="task-form">
      <input type="text" id="task-input" placeholder="Add a new task...">
      <button type="submit">Add</button>
    </form>
    <ul id="task-list"></ul>
  </div>
  <script src="/js/app.js"></script>
</body>
</html>
```

## Step 4: Add Functionality

Create `public/js/app.js`:

```javascript
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

let tasks = [];

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(taskInput.value);
  taskInput.value = '';
});

function addTask(title) {
  const task = {
    id: Date.now(),
    title,
    completed: false
  };
  tasks.push(task);
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = task.completed ? 'completed' : '';
    li.innerHTML = `
      <span>${task.title}</span>
      <button onclick="toggleTask(${task.id})">Toggle</button>
      <button onclick="deleteTask(${task.id})">Delete</button>
    `;
    taskList.appendChild(li);
  });
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    renderTasks();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}
```

## Step 5: Run Your Application

Start the development server:

```bash
binary serve
```

Open your browser to `http://localhost:8080` and try out your new todo app!

## Next Steps

- Add data persistence with local storage
- Implement user authentication
- Deploy to production

Congratulations! You've built your first application.
