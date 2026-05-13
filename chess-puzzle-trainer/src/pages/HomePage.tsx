import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Puzzle, StatsResponse } from '../types';

export function HomePage() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [daily, setDaily] = useState<{ date: string; puzzle: Puzzle } | null>(null);

  useEffect(() => {
    void apiRequest<StatsResponse>('/api/stats/me', { token }).then(setStats).catch(() => null);
    void apiRequest<{ date: string; puzzle: Puzzle }>('/api/puzzles/daily', { token }).then(setDaily).catch(() => null);
  }, [token]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section className="panel p-5">
        <p className="text-xs uppercase text-slate-400">Daily puzzle</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-100">{daily?.puzzle.title ?? 'Loading daily…'}</h1>
        <p className="mt-2 text-sm text-slate-400">{daily?.puzzle.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="chip">Date: {daily?.date || '-'}</span>
          <span className="chip">Rating: {daily?.puzzle.rating ?? '-'}</span>
          {daily?.puzzle.themes?.map((theme) => (
            <span key={theme} className="chip">{theme}</span>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Link className="btn-primary" to="/practice?daily=1">Start Daily</Link>
          <Link className="btn-secondary" to="/practice">Practice Random</Link>
          <Link className="btn-secondary" to="/collections">Collections</Link>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-100">
          {user ? `${user.displayName}'s Stats` : 'Profile Snapshot'}
        </h2>
        {!user && (
          <p className="mt-2 text-xs text-slate-500">Sign in to track your progress and rating.</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">Rating: <span className="text-cyan-300 font-semibold">{stats?.user.trainingRating ?? '-'}</span></p>
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">Streak: <span className="text-teal-300 font-semibold">{stats?.user.streak ?? '-'} 🔥</span></p>
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">Solved: <span className="text-green-300">{stats?.summary.solved ?? '-'}</span></p>
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">Failed: <span className="text-rose-300">{stats?.summary.failed ?? '-'}</span></p>
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">Skipped: {stats?.summary.skipped ?? '-'}</p>
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">Solve rate: <span className="text-teal-300 font-semibold">{stats?.summary.solveRate ?? '-'}%</span></p>
        </div>
      </section>
    </div>
  );
}
