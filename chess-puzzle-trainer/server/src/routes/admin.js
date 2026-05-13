const express = require('express');
const multer = require('multer');
const { Chess } = require('chess.js');
const prisma = require('../prisma');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();
const upload = multer();

function normalizePuzzle(raw, index = 0) {
  return {
    externalId: raw.externalId || `import-${Date.now()}-${index}`,
    fen: raw.fen,
    rating: Number(raw.rating || 1000),
    themes: Array.isArray(raw.themes) ? raw.themes : [],
    title: raw.title || `Imported Puzzle ${index + 1}`,
    description: raw.description || 'Imported puzzle',
    solutionMoves: Array.isArray(raw.solutionMoves) ? raw.solutionMoves : [],
    source: raw.source || 'admin-import'
  };
}

router.post('/import/json', authRequired, adminRequired, async (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== (process.env.ADMIN_IMPORT_KEY || 'admin-import-key')) {
    return res.status(403).json({ error: 'Invalid admin import key' });
  }

  const payload = Array.isArray(req.body?.puzzles) ? req.body.puzzles : [];
  if (payload.length === 0) return res.status(400).json({ error: 'Expected puzzles array' });

  const normalized = payload.map(normalizePuzzle).filter((p) => p.fen && p.solutionMoves.length > 0);

  for (const puzzle of normalized) {
    await prisma.puzzle.upsert({
      where: { externalId: puzzle.externalId },
      update: {
        fen: puzzle.fen,
        rating: puzzle.rating,
        themes: puzzle.themes,
        title: puzzle.title,
        description: puzzle.description,
        solutionMoves: puzzle.solutionMoves,
        source: puzzle.source
      },
      create: puzzle
    });
  }

  return res.json({ imported: normalized.length });
});

router.post('/import/pgn', authRequired, adminRequired, upload.single('pgn'), async (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== (process.env.ADMIN_IMPORT_KEY || 'admin-import-key')) {
    return res.status(403).json({ error: 'Invalid admin import key' });
  }

  const pgnText = req.file?.buffer?.toString('utf8') || req.body?.pgn;
  if (!pgnText) return res.status(400).json({ error: 'No PGN provided' });

  const games = pgnText.split(/\n\n(?=\[Event|1\.)/g).map((g) => g.trim()).filter(Boolean);
  let imported = 0;

  for (let idx = 0; idx < games.length; idx += 1) {
    const gameText = games[idx];
    const chess = new Chess();
    try {
      chess.loadPgn(gameText);
      const history = chess.history({ verbose: true });
      if (history.length === 0) continue;
      const last = history[history.length - 1];
      const moveUci = `${last.from}${last.to}${last.promotion || ''}`;

      await prisma.puzzle.create({
        data: {
          externalId: `pgn-${Date.now()}-${idx}`,
          fen: chess.fen(),
          rating: 1200,
          themes: ['imported', 'pgn'],
          title: `PGN Puzzle ${idx + 1}`,
          description: 'Auto-converted from PGN final move',
          solutionMoves: [moveUci],
          source: 'pgn-import'
        }
      });
      imported += 1;
    } catch (_error) {
      continue;
    }
  }

  return res.json({ imported });
});

module.exports = router;
