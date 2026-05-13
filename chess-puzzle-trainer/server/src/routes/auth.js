const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../prisma');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(40).optional()
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, isAdmin: user.isAdmin, displayName: user.displayName },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/signup', async (req, res) => {
  try {
    const payload = authSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (exists) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        email: payload.email.toLowerCase(),
        displayName: payload.displayName || payload.email.split('@')[0],
        passwordHash
      }
    });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, isAdmin: user.isAdmin } });
  } catch (error) {
    return res.status(400).json({ error: 'Invalid signup payload' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const payload = authSchema.pick({ email: true, password: true }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, isAdmin: user.isAdmin } });
  } catch (error) {
    return res.status(400).json({ error: 'Invalid login payload' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, displayName: true, isAdmin: true, trainingRating: true, streak: true, bestStreak: true }
  });

  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
});

module.exports = router;
