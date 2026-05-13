export type AttemptResult = 'solved' | 'failed' | 'skipped' | 'revealed';

export interface User {
  id: number;
  email: string;
  displayName: string;
  isAdmin: boolean;
  trainingRating: number;
  streak: number;
  bestStreak: number;
}

export interface Puzzle {
  id: number;
  externalId: string;
  fen: string;
  rating: number;
  themes: string[];
  title: string;
  description: string;
  solutionMoves: string[];
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  isDailyPool: boolean;
  _count?: {
    puzzles: number;
  };
}

export interface StatsResponse {
  user: User;
  summary: {
    total: number;
    solved: number;
    failed: number;
    skipped: number;
    solveRate: number;
    progressTracked: number;
  };
  themeBreakdown: Array<{ theme: string; attempts: number; solved: number }>;
  recentAttempts: Array<{
    id: number;
    result: AttemptResult;
    createdAt: string;
    puzzle: Puzzle;
  }>;
}
