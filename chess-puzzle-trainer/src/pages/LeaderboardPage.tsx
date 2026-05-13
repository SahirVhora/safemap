import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

interface LeaderRow {
  id: number;
  displayName: string;
  trainingRating: number;
  streak: number;
  bestStreak: number;
}

export function LeaderboardPage() {
  const { request } = useApi();
  const [rows, setRows] = useState<LeaderRow[]>([]);

  useEffect(() => {
    void request<{ leaderboard: LeaderRow[] }>('/api/leaderboard').then((response) => setRows(response.leaderboard)).catch(() => setRows([]));
  }, [request]);

  return (
    <section className="panel p-5">
      <h1 className="text-xl font-semibold text-slate-100">Leaderboard</h1>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="p-2">Rank</th>
              <th className="p-2">Player</th>
              <th className="p-2">Rating</th>
              <th className="p-2">Streak</th>
              <th className="p-2">Best Streak</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className="border-t border-slate-800">
                <td className="p-2 text-slate-300">{idx + 1}</td>
                <td className="p-2 text-slate-100">{row.displayName}</td>
                <td className="p-2 text-cyan-300">{row.trainingRating}</td>
                <td className="p-2 text-slate-300">{row.streak}</td>
                <td className="p-2 text-slate-300">{row.bestStreak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
