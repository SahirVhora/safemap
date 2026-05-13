function expectedScore(player, opponent) {
  return 1 / (1 + 10 ** ((opponent - player) / 400));
}

function computeRatingDelta(current, puzzleRating, result, hintsUsed = 0) {
  const expected = expectedScore(current, puzzleRating);
  const score = result === 'solved' ? 1 : result === 'failed' ? 0 : 0.2;
  const k = result === 'solved' ? 24 : 16;
  const penalty = hintsUsed * 2;
  const raw = Math.round(k * (score - expected)) - penalty;
  return Math.max(-30, Math.min(30, raw));
}

module.exports = { computeRatingDelta };
