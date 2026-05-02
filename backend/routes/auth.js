const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDb, query, queryOne, run } = require('../models/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'member']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role = 'member' } = req.body;
  try {
    await getDb();
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#4070ff','#b060ff','#00e5aa','#ff6630','#ffaa00','#ff3366'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const avatar = JSON.stringify({ initials, color });

    const result = run(
      'INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, role, avatar]
    );

    const user = queryOne('SELECT id, name, email, role, avatar FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    await getDb();
    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

router.get('/users', authenticate, async (req, res) => {
  await getDb();
  const users = query('SELECT id, name, email, role, avatar FROM users ORDER BY name');
  res.json({ users });
});

module.exports = router;
