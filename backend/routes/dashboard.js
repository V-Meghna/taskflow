const express = require('express');
const { getDb, query, queryOne } = require('../models/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  await getDb();
  const uid = req.user.id;
  const isAdmin = req.user.role === 'admin';
  const today = new Date().toISOString().split('T')[0];

  let stats, recentTasks, myTasks;

  if (isAdmin) {
    const s = queryOne(`SELECT
      (SELECT COUNT(*) FROM projects) as total_projects,
      (SELECT COUNT(*) FROM projects WHERE status='active') as active_projects,
      (SELECT COUNT(*) FROM tasks) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status='done') as completed_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status='in_progress') as in_progress_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status='todo') as todo_tasks,
      (SELECT COUNT(*) FROM tasks WHERE deadline < ? AND status != 'done') as overdue_tasks,
      (SELECT COUNT(*) FROM users) as total_users
    `, [today]);
    stats = s;
    recentTasks = query(`
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      ORDER BY t.updated_at DESC LIMIT 10
    `);
    myTasks = query(`
      SELECT t.*, p.name as project_name FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ? AND t.status != 'done'
      ORDER BY t.deadline ASC LIMIT 5
    `, [uid]);
  } else {
    const s = queryOne(`SELECT
      (SELECT COUNT(DISTINCT p.id) FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
        WHERE p.owner_id = ? OR pm.user_id = ?) as total_projects,
      (SELECT COUNT(*) FROM tasks WHERE assignee_id = ?) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE assignee_id = ? AND status='done') as completed_tasks,
      (SELECT COUNT(*) FROM tasks WHERE assignee_id = ? AND status='in_progress') as in_progress_tasks,
      (SELECT COUNT(*) FROM tasks WHERE assignee_id = ? AND status='todo') as todo_tasks,
      (SELECT COUNT(*) FROM tasks WHERE assignee_id = ? AND deadline < ? AND status != 'done') as overdue_tasks
    `, [uid,uid,uid,uid,uid,uid,uid,uid,today]);
    stats = s;
    recentTasks = query(`
      SELECT DISTINCT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
      WHERE p.owner_id = ? OR pm.user_id = ?
      ORDER BY t.updated_at DESC LIMIT 10
    `, [uid,uid,uid]);
    myTasks = query(`
      SELECT t.*, p.name as project_name FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ? AND t.status != 'done'
      ORDER BY t.deadline ASC LIMIT 5
    `, [uid]);
  }

  const tasksByStatus = query(`SELECT status, COUNT(*) as count FROM tasks ${isAdmin?'':'WHERE assignee_id = ?'} GROUP BY status`, isAdmin?[]:[uid]);
  const tasksByPriority = query(`SELECT priority, COUNT(*) as count FROM tasks WHERE status != 'done' ${isAdmin?'':'AND assignee_id = ?'} GROUP BY priority`, isAdmin?[]:[uid]);

  res.json({ stats, recentTasks, myTasks, tasksByStatus, tasksByPriority });
});

module.exports = router;
