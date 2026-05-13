const express = require('express');
const prisma = require('../prisma');
const { authOptional } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authOptional, async (req, res) => {
  const userId = req.user.id;

  const [user, attempts, progress] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true, trainingRating: true, streak: true, bestStreak: true }
    }),
    prisma.attempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { puzzle: true },
      take: 100
    }),
    prisma.puzzleProgress.findMany({ where: { userId } })
  ]);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const solved = attempts.filter((item) => item.result === 'solved').length;
  const failed = attempts.filter((item) => item.result === 'failed' || item.result === 'revealed').length;
  const skipped = attempts.filter((item) => item.result === 'skipped').length;
  const total = attempts.length;
  const solveRate = total === 0 ? 0 : Math.round((solved / total) * 100);

  const themeMap = {};
  attempts.forEach((attempt) => {
    const themes = Array.isArray(attempt.puzzle.themes) ? attempt.puzzle.themes : [];
    themes.forEach((theme) => {
      if (!themeMap[theme]) themeMap[theme] = { attempts: 0, solved: 0 };
      themeMap[theme].attempts += 1;
      if (attempt.result === 'solved') themeMap[theme].solved += 1;
    });
  });

  return res.json({
    user,
    summary: {
      total,
      solved,
      failed,
      skipped,
      solveRate,
      progressTracked: progress.length
    },
    themeBreakdown: Object.entries(themeMap).map(([theme, value]) => ({ theme, ...value })),
    recentAttempts: attempts.slice(0, 20)
  });
});

module.exports = router;
