import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { StatsResponse } from '../types';

export function ProfilePage() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void apiRequest<StatsResponse>('/api/stats/me', { token })
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load stats'));
  }, [token]);

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <article className="panel p-5">
        <h1 className="text-xl font-semibold text-slate-100">Profile</h1>
        {!user && <p className="mt-2 text-sm text-slate-500">Sign in to see your full profile.</p>}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">Name: {stats?.user.displayName ?? '-'}</p>
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">Email: {stats?.user.email ?? '-'}</p>
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">
            Rating: <span className="text-cyan-300 font-semibold">{stats?.user.trainingRating ?? '-'}</span>
          </p>
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">
            Streak: <span className="text-teal-300">{stats?.user.streak ?? '-'} 🔥</span>
          </p>
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">Best streak: {stats?.user.bestStreak ?? '-'}</p>
          <p className="rounded-lg bg-slate-900/70 p-2 text-slate-300">
            Solve rate: <span className="text-teal-300">{stats?.summary.solveRate ?? '-'}%</span>
          </p>
        </div>

        {stats && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-green-900/20 border border-green-800/40 p-2">
              <p className="text-2xl font-bold text-green-300">{stats.summary.solved}</p>
              <p className="text-slate-400">Solved</p>
            </div>
            <div className="rounded-lg bg-rose-900/20 border border-rose-800/40 p-2">
              <p className="text-2xl font-bold text-rose-300">{stats.summary.failed}</p>
              <p className="text-slate-400">Failed</p>
            </div>
            <div className="rounded-lg bg-slate-900/50 border border-slate-700/40 p-2">
              <p className="text-2xl font-bold text-slate-300">{stats.summary.skipped}</p>
              <p className="text-slate-400">Skipped</p>
            </div>
          </div>
        )}
      </article>

      <article className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-100">Theme Breakdown</h2>
        <div className="mt-3 grid gap-2">
          {stats?.themeBreakdown?.length === 0 && (
            <p className="text-sm text-slate-500">No theme data yet. Start solving puzzles!</p>
          )}
          {stats?.themeBreakdown?.map((row) => (
            <div key={row.theme} className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-100">{row.theme}</span>
                <span className="text-slate-400">{row.solved}/{row.attempts}</span>
              </div>
              <div className="mt-2 h-2 rounded bg-slate-800">
                <div
                  className="h-2 rounded bg-teal-400/80 transition-all"
                  style={{ width: `${row.attempts ? (row.solved / row.attempts) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
