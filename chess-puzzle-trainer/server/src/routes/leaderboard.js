const express = require('express');
const prisma = require('../prisma');
const { authOptional } = require('../middleware/auth');

const router = express.Router();

router.get('/', authOptional, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      displayName: true,
      trainingRating: true,
      streak: true,
      bestStreak: true
    },
    orderBy: [{ trainingRating: 'desc' }, { bestStreak: 'desc' }],
    take: 50
  });

  return res.json({ leaderboard: users });
});

module.exports = router;
