require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./prisma');

const authRoutes = require('./routes/auth');
const puzzleRoutes = require('./routes/puzzles');
const attemptRoutes = require('./routes/attempts');
const statsRoutes = require('./routes/stats');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, async () => {
  await prisma.$connect();
  console.log(`API server listening on http://localhost:${port}`);
});
