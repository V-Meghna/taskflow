const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb, query, queryOne, run } = require('../models/database');
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  await getDb();
  let projects;
  if (req.user.role === 'admin') {
    projects = query(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
      FROM projects p JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `);
  } else {
    projects = query(`
      SELECT DISTINCT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
      FROM projects p JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
      WHERE p.owner_id = ? OR pm.user_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id, req.user.id, req.user.id]);
  }
  res.json({ projects });
});

router.post('/', authenticate, [
  body('name').trim().notEmpty(),
  body('deadline').optional().isDate(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, description, deadline } = req.body;
  await getDb();
  const result = run(
    'INSERT INTO projects (name, description, deadline, owner_id) VALUES (?, ?, ?, ?)',
    [name, description || null, deadline || null, req.user.id]
  );
  run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
    [result.lastInsertRowid, req.user.id, 'admin']);
  const project = queryOne('SELECT * FROM projects WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json({ project });
});

router.get('/:projectId', authenticate, requireProjectAccess, async (req, res) => {
  await getDb();
  const members = query(`
    SELECT u.id, u.name, u.email, u.avatar, pm.role, pm.joined_at
    FROM project_members pm JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `, [req.params.projectId]);
  res.json({ project: req.project, members });
});

router.put('/:projectId', authenticate, requireProjectAccess, requireProjectAdmin, async (req, res) => {
  const { name, description, status, deadline } = req.body;
  await getDb();
  const updates = []; const values = [];
  if (name)              { updates.push('name = ?'); values.push(name); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (status)            { updates.push('status = ?'); values.push(status); }
  if (deadline !== undefined)  { updates.push('deadline = ?'); values.push(deadline); }
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.projectId);
  run(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values);
  const updated = queryOne('SELECT * FROM projects WHERE id = ?', [req.params.projectId]);
  res.json({ project: updated });
});

router.delete('/:projectId', authenticate, requireProjectAccess, requireProjectAdmin, async (req, res) => {
  await getDb();
  run('DELETE FROM projects WHERE id = ?', [req.params.projectId]);
  res.json({ message: 'Project deleted' });
});

router.post('/:projectId/members', authenticate, requireProjectAccess, requireProjectAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'member']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, role = 'member' } = req.body;
  await getDb();
  const user = queryOne('SELECT id, name, email, avatar FROM users WHERE email = ?', [email]);
  if (!user) return res.status(404).json({ error: 'User not found with that email' });
  const existing = queryOne('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
    [req.params.projectId, user.id]);
  if (existing) return res.status(409).json({ error: 'User already in project' });
  run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
    [req.params.projectId, user.id, role]);
  res.status(201).json({ message: 'Member added', user });
});

router.delete('/:projectId/members/:userId', authenticate, requireProjectAccess, requireProjectAdmin, async (req, res) => {
  await getDb();
  run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
    [req.params.projectId, req.params.userId]);
  res.json({ message: 'Member removed' });
});

module.exports = router;
