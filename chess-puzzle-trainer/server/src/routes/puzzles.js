const express = require('express');
const prisma = require('../prisma');
const { authOptional } = require('../middleware/auth');
const { dailyIndex, dateKey } = require('../utils/daily');

const router = express.Router();

router.get('/', authOptional, async (req, res) => {
  const { theme, minRating, maxRating, collectionId, q } = req.query;

  const puzzles = await prisma.puzzle.findMany({
    where: {
      rating: {
        gte: minRating ? Number(minRating) : undefined,
        lte: maxRating ? Number(maxRating) : undefined
      },
      title: q
        ? {
            contains: String(q),
            mode: 'insensitive'
          }
        : undefined,
      collections: collectionId
        ? {
            some: {
              collectionId: Number(collectionId)
            }
          }
        : undefined
    },
    orderBy: { rating: 'asc' }
  });

  const filtered = theme
    ? puzzles.filter((p) => Array.isArray(p.themes) && p.themes.includes(String(theme)))
    : puzzles;

  return res.json({ puzzles: filtered });
});

router.get('/daily', authOptional, async (req, res) => {
  const pool = await prisma.puzzle.findMany({
    where: {
      collections: {
        some: {
          collection: {
            isDailyPool: true
          }
        }
      }
    },
    orderBy: { id: 'asc' }
  });

  const all = pool.length > 0 ? pool : await prisma.puzzle.findMany({ orderBy: { id: 'asc' } });
  if (all.length === 0) return res.status(404).json({ error: 'No puzzles found' });

  const key = dateKey();
  const puzzle = all[dailyIndex(all.length, key)];
  return res.json({ date: key, puzzle });
});

router.get('/collections', authOptional, async (req, res) => {
  const collections = await prisma.collection.findMany({
    include: {
      _count: {
        select: {
          puzzles: true
        }
      }
    },
    orderBy: { id: 'asc' }
  });

  return res.json({ collections });
});

router.get('/collections/:id/puzzles', authOptional, async (req, res) => {
  const collectionId = Number(req.params.id);
  const items = await prisma.collectionPuzzle.findMany({
    where: { collectionId },
    include: { puzzle: true },
    orderBy: { orderIndex: 'asc' }
  });

  return res.json({ puzzles: items.map((item) => item.puzzle) });
});

router.get('/:id/progress', authOptional, async (req, res) => {
  const puzzleId = Number(req.params.id);
  const progress = await prisma.puzzleProgress.findUnique({
    where: {
      userId_puzzleId: {
        userId: req.user.id,
        puzzleId
      }
    }
  });

  return res.json({ progress });
});

module.exports = router;
