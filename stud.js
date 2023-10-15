const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cron = require('cron');

const app = express();
app.use(bodyParser.json());


const adminEmail = 'admin@aadmin.com';
const adminPassword = 'admin';
const adminSecretKey = 'admin1234';
const studentSecretKey = 'std1234';

const students = [];
const tasks = [];

app.post('/admin', (req, res) => {
  const { email, password } = req.body;
  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign({ email }, adminSecretKey, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

app.post('/student', (req, res) => {
  const { email, password } = req.body;
  const student = students.find((s) => s.email === email && s.password === password);
  if (student) {
    const token = jwt.sign({ email }, studentSecretKey, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

function verifyAdminToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  jwt.verify(token, adminSecretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.adminEmail = decoded.email;
    next();
  });
}

function verifyStudentToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  jwt.verify(token, studentSecretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.studentEmail = decoded.email;
    next();
  });
}

app.post('/admin/add-std', verifyAdminToken, (req, res) => {
  const { name, email, password, department } = req.body;
  students.push({ name, email, password, department });
  res.json({ message: 'Student added successfully' });
});

app.post('/admin/assign-task', verifyAdminToken, (req, res) => {
  const { studentEmail, task, dueTime } = req.body;
  tasks.push({ studentEmail, task, dueTime, status: 'pending' });
  res.json({ message: 'Task assigned successfully' });
});

app.get('/student/tasks', verifyStudentToken, (req, res) => {
  const studentTasks = tasks.filter((task) => task.studentEmail === req.studentEmail);
  res.json(studentTasks);
});

app.put('/student/done/:taskId', verifyStudentToken, (req, res) => {
  const taskId = parseInt(req.params.taskId, 10);
  const task = tasks.find((t) => t.studentEmail === req.studentEmail && t.status === 'pending' && taskId === t.id);
  if (task) {
    task.status = 'completed';
    res.json({ message: 'Task marked as done' });
  } else {
    res.status(404).json({ message: 'Task not found or already completed' });
  }
});

app.listen(9900, () => {
  console.log(`Server is running on port 9900`);
});
