const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb, query, queryOne, run } = require('../models/database');
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

const taskWithUsers = (taskId) => queryOne(`
  SELECT t.*, u1.name as assignee_name, u1.avatar as assignee_avatar, u2.name as creator_name
  FROM tasks t
  LEFT JOIN users u1 ON t.assignee_id = u1.id
  LEFT JOIN users u2 ON t.creator_id = u2.id
  WHERE t.id = ?
`, [taskId]);

router.get('/', authenticate, requireProjectAccess, async (req, res) => {
  await getDb();
  const tasks = query(`
    SELECT t.*, u1.name as assignee_name, u1.avatar as assignee_avatar, u2.name as creator_name
    FROM tasks t
    LEFT JOIN users u1 ON t.assignee_id = u1.id
    LEFT JOIN users u2 ON t.creator_id = u2.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `, [req.params.projectId]);
  res.json({ tasks });
});

router.post('/', authenticate, requireProjectAccess, [
  body('title').trim().notEmpty(),
  body('priority').optional().isIn(['low','medium','high','critical']),
  body('assignee_id').optional(),
  body('deadline').optional(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { title, description, priority = 'medium', assignee_id, deadline, status = 'todo' } = req.body;
  await getDb();
  if (assignee_id) {
    const member = queryOne('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [req.params.projectId, assignee_id]);
    if (!member) return res.status(400).json({ error: 'Assignee must be a project member' });
  }
  const result = run(`
    INSERT INTO tasks (title, description, priority, status, assignee_id, deadline, project_id, creator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [title, description||null, priority, status, assignee_id||null, deadline||null, req.params.projectId, req.user.id]);
  const task = taskWithUsers(result.lastInsertRowid);
  res.status(201).json({ task });
});

router.put('/:taskId', authenticate, requireProjectAccess, async (req, res) => {
  await getDb();
  const task = queryOne('SELECT * FROM tasks WHERE id = ? AND project_id = ?',
    [req.params.taskId, req.params.projectId]);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const isAdmin = req.projectMember?.role === 'admin' || req.user.role === 'admin' || req.project.owner_id === req.user.id;
  const isInvolved = task.creator_id === req.user.id || task.assignee_id === req.user.id;
  if (!isAdmin && !isInvolved) return res.status(403).json({ error: 'Not authorized' });

  const { title, description, status, priority, assignee_id, deadline } = req.body;
  const updates = []; const values = [];
  if (title)       { updates.push('title = ?'); values.push(title); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (status)      { updates.push('status = ?'); values.push(status); }
  if (priority)    { updates.push('priority = ?'); values.push(priority); }
  if (assignee_id !== undefined) { updates.push('assignee_id = ?'); values.push(assignee_id||null); }
  if (deadline !== undefined)  { updates.push('deadline = ?'); values.push(deadline||null); }
  updates.push('updated_at = CURRENT_TIMESTAMP');
  if (updates.length === 1) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.taskId);
  run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);
  const updated = taskWithUsers(req.params.taskId);
  res.json({ task: updated });
});

router.delete('/:taskId', authenticate, requireProjectAccess, requireProjectAdmin, async (req, res) => {
  await getDb();
  run('DELETE FROM tasks WHERE id = ? AND project_id = ?', [req.params.taskId, req.params.projectId]);
  res.json({ message: 'Task deleted' });
});

router.get('/:taskId/comments', authenticate, requireProjectAccess, async (req, res) => {
  await getDb();
  const comments = query(`
    SELECT c.*, u.name, u.avatar FROM task_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ? ORDER BY c.created_at ASC
  `, [req.params.taskId]);
  res.json({ comments });
});

router.post('/:taskId/comments', authenticate, requireProjectAccess, [
  body('content').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  await getDb();
  const result = run('INSERT INTO task_comments (task_id, user_id, content) VALUES (?, ?, ?)',
    [req.params.taskId, req.user.id, req.body.content]);
  const comment = queryOne(`
    SELECT c.*, u.name, u.avatar FROM task_comments c
    JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `, [result.lastInsertRowid]);
  res.status(201).json({ comment });
});

module.exports = router;
