const jwt = require('jsonwebtoken');
const { getDb, queryOne } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-change-in-production';

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authentication required' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await getDb();
    const user = queryOne('SELECT id, name, email, role, avatar FROM users WHERE id = ?', [decoded.userId]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function requireProjectAccess(req, res, next) {
  const projectId = req.params.projectId;
  if (!projectId) return next();
  await getDb();
  const project = queryOne('SELECT * FROM projects WHERE id = ?', [projectId]);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const member = queryOne(
    'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, req.user.id]
  );

  if (!member && req.user.role !== 'admin' && project.owner_id !== req.user.id)
    return res.status(403).json({ error: 'Access denied to this project' });

  req.project = project;
  req.projectMember = member;
  next();
}

function requireProjectAdmin(req, res, next) {
  if (req.user.role === 'admin') return next();
  if (req.project && req.project.owner_id === req.user.id) return next();
  if (req.projectMember && req.projectMember.role === 'admin') return next();
  return res.status(403).json({ error: 'Project admin access required' });
}

module.exports = { authenticate, requireProjectAccess, requireProjectAdmin, JWT_SECRET };
