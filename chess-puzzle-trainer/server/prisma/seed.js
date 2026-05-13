const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const baseTemplates = [
  {
    fen: '6k1/6pp/8/7Q/2B5/8/8/6K1 w - - 0 1',
    rating: 1080,
    themes: ['mate', 'pin'],
    title: 'Diagonal Net',
    description: 'Force king movement, then finish on the back rank.',
    solutionMoves: ['h5f7', 'g8h8', 'f7g8']
  },
  {
    fen: '6k1/6p1/8/7Q/8/8/6PP/6K1 w - - 0 1',
    rating: 980,
    themes: ['mate', 'deflection'],
    title: 'Check and Return',
    description: 'Start with check, then re-route your queen.',
    solutionMoves: ['h5e8', 'g8h7', 'e8h5']
  },
  {
    fen: '6k1/6p1/8/8/6Q1/8/6PP/6K1 w - - 0 1',
    rating: 1140,
    themes: ['skewer', 'discovered attack'],
    title: 'Cross-Diagonal Pressure',
    description: 'Use a diagonal check and centralize after reply.',
    solutionMoves: ['g4c8', 'g8f7', 'c8e6']
  },
  {
    fen: '6k1/8/8/8/6q1/8/8/6K1 b - - 0 1',
    rating: 1200,
    themes: ['mate', 'deflection'],
    title: 'Black Counterfire',
    description: 'Black to move and invade decisively.',
    solutionMoves: ['g4d1', 'g1f2', 'd1d8']
  },
  {
    fen: '6k1/8/8/8/5q2/8/8/5RK1 b - - 0 1',
    rating: 1260,
    themes: ['hanging piece', 'deflection'],
    title: 'Exchange Deflection',
    description: 'Black wins coordination with forcing queen play.',
    solutionMoves: ['f4f1', 'g1f1', 'g8f8']
  },
  {
    fen: '4k3/4q3/8/8/8/8/4Q3/4K3 w - - 0 1',
    rating: 780,
    themes: ['hanging piece'],
    title: 'Free Queen',
    description: 'Take the loose queen in one move.',
    solutionMoves: ['e2e7']
  },
  {
    fen: '6k1/8/5q2/8/4N3/8/8/6K1 w - - 0 1',
    rating: 990,
    themes: ['fork', 'hanging piece'],
    title: 'Knight Fork Pickup',
    description: 'Jump with tempo and win the queen.',
    solutionMoves: ['e4f6']
  },
  {
    fen: '6k1/8/8/8/8/8/8/3Q2K1 w - - 0 1',
    rating: 620,
    themes: ['mate', 'endgame tactic'],
    title: 'Back Rank Tap',
    description: 'Simple queen mate pattern.',
    solutionMoves: ['d1d8']
  },
  {
    fen: '6k1/8/8/8/8/8/8/4R1K1 w - - 0 1',
    rating: 900,
    themes: ['mate', 'endgame tactic'],
    title: 'Rook Ladder',
    description: 'Central rook mate pattern.',
    solutionMoves: ['e1e8']
  },
  {
    fen: '6k1/8/8/8/8/8/8/2B3K1 w - - 0 1',
    rating: 1100,
    themes: ['skewer', 'pin'],
    title: 'Bishop Long Diagonal',
    description: 'Bishop finds the strongest diagonal square.',
    solutionMoves: ['c1h6']
  }
];

function generatePuzzles(count = 50) {
  const result = [];
  for (let index = 0; index < count; index += 1) {
    const template = baseTemplates[index % baseTemplates.length];
    const ratingDrift = (index % 5) * 15;
    result.push({
      externalId: `seed-${String(index + 1).padStart(3, '0')}`,
      fen: template.fen,
      rating: Math.max(500, template.rating + ratingDrift),
      themes: template.themes,
      title: `${template.title} ${index + 1}`,
      description: template.description,
      solutionMoves: template.solutionMoves,
      source: 'seed'
    });
  }
  return result;
}

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'chess-local-dev-only';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.attempt.deleteMany();
  await prisma.puzzleProgress.deleteMany();
  await prisma.collectionPuzzle.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.puzzle.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@local.dev',
      displayName: 'Admin',
      passwordHash,
      isAdmin: true
    }
  });

  await prisma.user.create({
    data: {
      email: 'demo@local.dev',
      displayName: 'Demo User',
      passwordHash
    }
  });

  const puzzles = generatePuzzles(60);
  await prisma.puzzle.createMany({ data: puzzles });

  const allPuzzles = await prisma.puzzle.findMany({ orderBy: { id: 'asc' } });

  const collections = await Promise.all([
    prisma.collection.create({ data: { name: 'Daily Pool', description: 'Used for deterministic daily puzzle', isDailyPool: true } }),
    prisma.collection.create({ data: { name: 'Fork & Tactics', description: 'Forks and tactical motifs' } }),
    prisma.collection.create({ data: { name: 'Mating Nets', description: 'Checkmate patterns and mating nets' } }),
    prisma.collection.create({ data: { name: 'Endgame Shots', description: 'Endgame tactical shots' } })
  ]);

  const collectionMap = Object.fromEntries(collections.map((c) => [c.name, c.id]));

  const links = [];
  allPuzzles.forEach((puzzle, idx) => {
    links.push({ collectionId: collectionMap['Daily Pool'], puzzleId: puzzle.id, orderIndex: idx });

    const themes = Array.isArray(puzzle.themes) ? puzzle.themes : [];
    if (themes.includes('fork')) {
      links.push({ collectionId: collectionMap['Fork & Tactics'], puzzleId: puzzle.id, orderIndex: idx });
    }
    if (themes.includes('mate')) {
      links.push({ collectionId: collectionMap['Mating Nets'], puzzleId: puzzle.id, orderIndex: idx });
    }
    if (themes.includes('endgame tactic')) {
      links.push({ collectionId: collectionMap['Endgame Shots'], puzzleId: puzzle.id, orderIndex: idx });
    }
  });

  // Insert links one by one so duplicate-key conflicts are skipped gracefully
  for (const link of links) {
    await prisma.collectionPuzzle.upsert({
      where: { collectionId_puzzleId: { collectionId: link.collectionId, puzzleId: link.puzzleId } },
      update: {},
      create: link
    });
  }

  console.log(`Seed complete. Admin: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
