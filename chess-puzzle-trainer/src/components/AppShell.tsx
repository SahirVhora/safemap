import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'rounded-lg border border-teal-300/40 bg-teal-500/25 px-3 py-2 text-sm text-white'
    : 'rounded-lg border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 hover:border-slate-500';

function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, displayName || undefined);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <article
        className="panel w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <button className="text-slate-400 hover:text-slate-200" onClick={onClose} type="button">✕</button>
        </div>

        <form onSubmit={submit} className="mt-4 grid gap-3">
          {mode === 'signup' && (
            <input
              className="rounded-lg border border-slate-600/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
              placeholder="Display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <input
            className="rounded-lg border border-slate-600/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-slate-600/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <>No account?{' '}<button className="text-teal-400 hover:underline" onClick={() => setMode('signup')} type="button">Sign up</button></>
          ) : (
            <>Already have one?{' '}<button className="text-teal-400 hover:underline" onClick={() => setMode('login')} type="button">Sign in</button></>
          )}
        </p>

        <p className="mt-3 text-center text-xs text-slate-600">
          Demo: demo@local.dev / password123
        </p>
      </article>
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <main className="mx-auto min-h-screen w-[min(1180px,100%-1rem)] py-4">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <header className="panel sticky top-3 z-20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            ♟ Chess Trainer
          </Link>
          <nav className="flex flex-wrap gap-2">
            <NavLink to="/" className={navClass} end>Home</NavLink>
            <NavLink to="/practice" className={navClass}>Practice</NavLink>
            <NavLink to="/collections" className={navClass}>Collections</NavLink>
            <NavLink to="/profile" className={navClass}>Profile</NavLink>
            <NavLink to="/leaderboard" className={navClass}>Leaderboard</NavLink>
            {user?.isAdmin && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-teal-300">⬤ {user.displayName}</span>
                <span className="text-xs text-slate-500">#{user.trainingRating}</span>
                <button className="btn-secondary text-xs" onClick={logout} type="button">Sign out</button>
              </>
            ) : (
              <button className="btn-primary text-xs" onClick={() => setShowAuth(true)} type="button">Sign in</button>
            )}
          </div>
        </div>
      </header>

      <section className="mt-4">
        <Outlet />
      </section>

      <footer className="py-6 text-center text-xs text-slate-500">
        Chess Puzzle Trainer · SQLite + Prisma + Express
      </footer>
    </main>
  );
}
