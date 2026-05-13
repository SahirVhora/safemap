import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Collection } from '../types';

export function CollectionsPage() {
  const { token } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    void apiRequest<{ collections: Collection[] }>('/api/puzzles/collections', { token })
      .then((response) => setCollections(response.collections))
      .catch(() => setCollections([]));
  }, [token]);

  return (
    <section className="panel p-5">
      <h1 className="text-xl font-semibold text-slate-100">Puzzle Collections</h1>
      {collections.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No collections found. Run the server seed to populate.</p>
      )}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {collections.map((collection) => (
          <article key={collection.id} className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-4 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-100">{collection.name}</h2>
              {collection.isDailyPool && (
                <span className="chip text-xs text-teal-300 border-teal-700/60">Daily</span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">{collection.description}</p>
            <p className="mt-2 text-xs text-slate-500">{collection._count?.puzzles ?? 0} puzzles</p>
            <Link
              className="btn-primary mt-3 inline-block"
              to={`/practice?collection=${collection.id}`}
            >
              Open Collection →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
