const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const { authOptional } = require('../middleware/auth');
const { computeRatingDelta } = require('../utils/rating');

const router = express.Router();

const attemptSchema = z.object({
  puzzleId: z.number().int().positive(),
  result: z.enum(['solved', 'failed', 'skipped', 'revealed']),
  hintsUsed: z.number().int().min(0).max(10).default(0),
  retriesUsed: z.number().int().min(0).max(20).default(0),
  isDaily: z.boolean().default(false)
});

router.post('/', authOptional, async (req, res) => {
  try {
    const payload = attemptSchema.parse(req.body);
    const [user, puzzle] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id } }),
      prisma.puzzle.findUnique({ where: { id: payload.puzzleId } })
    ]);

    if (!user || !puzzle) return res.status(404).json({ error: 'User or puzzle not found' });

    const delta = computeRatingDelta(user.trainingRating, puzzle.rating, payload.result, payload.hintsUsed);
    const nextRating = Math.max(400, Math.min(3000, user.trainingRating + delta));
    const nextStreak = payload.result === 'solved' ? user.streak + 1 : 0;
    const nextBest = Math.max(user.bestStreak, nextStreak);

    const [attempt, updatedUser] = await prisma.$transaction([
      prisma.attempt.create({
        data: {
          userId: user.id,
          puzzleId: puzzle.id,
          result: payload.result,
          hintsUsed: payload.hintsUsed,
          retriesUsed: payload.retriesUsed,
          isDaily: payload.isDaily,
          ratingDelta: delta
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          trainingRating: nextRating,
          streak: nextStreak,
          bestStreak: nextBest
        }
      }),
      prisma.puzzleProgress.upsert({
        where: {
          userId_puzzleId: {
            userId: user.id,
            puzzleId: puzzle.id
          }
        },
        create: {
          userId: user.id,
          puzzleId: puzzle.id,
          attemptsCount: 1,
          solvedCount: payload.result === 'solved' ? 1 : 0,
          failedCount: payload.result === 'failed' || payload.result === 'revealed' ? 1 : 0,
          skippedCount: payload.result === 'skipped' ? 1 : 0,
          lastResult: payload.result,
          lastAttemptAt: new Date()
        },
        update: {
          attemptsCount: { increment: 1 },
          solvedCount: payload.result === 'solved' ? { increment: 1 } : undefined,
          failedCount: payload.result === 'failed' || payload.result === 'revealed' ? { increment: 1 } : undefined,
          skippedCount: payload.result === 'skipped' ? { increment: 1 } : undefined,
          lastResult: payload.result,
          lastAttemptAt: new Date()
        }
      })
    ]);

    return res.json({ attempt, user: { trainingRating: updatedUser.trainingRating, streak: updatedUser.streak, bestStreak: updatedUser.bestStreak } });
  } catch (error) {
    return res.status(400).json({ error: 'Invalid attempt payload' });
  }
});

module.exports = router;
