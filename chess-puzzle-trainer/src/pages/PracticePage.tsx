import type { Arrow } from 'react-chessboard/dist/chessboard/types';
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Puzzle } from '../types';
import { parseUci } from '../utils/chess';

/* ─── helpers ─────────────────────────────────────────────── */

function sideToMove(fen: string): 'white' | 'black' {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white';
}

function ratingColor(r: number) {
  if (r < 1000) return 'text-green-400 border-green-500/40 bg-green-900/20';
  if (r < 1500) return 'text-yellow-300 border-yellow-500/40 bg-yellow-900/20';
  if (r < 2000) return 'text-orange-400 border-orange-500/40 bg-orange-900/20';
  return 'text-rose-400 border-rose-500/40 bg-rose-900/20';
}

function ratingLabel(r: number) {
  if (r < 1000) return 'Beginner';
  if (r < 1500) return 'Intermediate';
  if (r < 2000) return 'Advanced';
  return 'Expert';
}

function themeColor(theme: string) {
  const map: Record<string, string> = {
    mate: 'bg-rose-900/40 text-rose-300 border-rose-600/40',
    'mateIn1': 'bg-rose-900/40 text-rose-300 border-rose-600/40',
    'mateIn2': 'bg-rose-900/40 text-rose-300 border-rose-600/40',
    fork: 'bg-violet-900/40 text-violet-300 border-violet-600/40',
    pin: 'bg-blue-900/40 text-blue-300 border-blue-600/40',
    skewer: 'bg-cyan-900/40 text-cyan-300 border-cyan-600/40',
    tactic: 'bg-amber-900/40 text-amber-300 border-amber-600/40',
    endgame: 'bg-slate-800/70 text-slate-300 border-slate-600/40',
    opening: 'bg-emerald-900/40 text-emerald-300 border-emerald-600/40',
    middlegame: 'bg-indigo-900/40 text-indigo-300 border-indigo-600/40',
  };
  for (const key of Object.keys(map)) {
    if (theme.toLowerCase().includes(key)) return map[key];
  }
  return 'bg-slate-800/70 text-slate-300 border-slate-600/40';
}

/* ─── board sizing hook ────────────────────────────────────── */

function useBoardSize(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState(480);
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = window.innerHeight - 100; // leave room for nav
      setSize(Math.min(w, h, 680));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, [containerRef]);
  return size;
}

/* ─── component ────────────────────────────────────────────── */

export function PracticePage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const isDaily = searchParams.get('daily') === '1';
  const collection = searchParams.get('collection');

  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [index, setIndex] = useState(0);
  const [chess, setChess] = useState(new Chess());
  const [fen, setFen] = useState('');
  const [moveIndex, setMoveIndex] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [message, setMessage] = useState<{ text: string; kind: 'neutral' | 'success' | 'error' | 'info' }>({ text: 'Loading puzzles…', kind: 'neutral' });
  const [solved, setSolved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [moveLog, setMoveLog] = useState<Array<{ san: string; isPlayer: boolean }>>([]);

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const boardSize = useBoardSize(boardContainerRef);
  const current = puzzles[index];

  /* load puzzles */
  useEffect(() => {
    void (async () => {
      try {
        if (isDaily) {
          const r = await apiRequest<{ date: string; puzzle: Puzzle }>('/api/puzzles/daily', { token });
          setPuzzles([r.puzzle]);
          setMessage({ text: `Daily puzzle — ${r.date}`, kind: 'neutral' });
        } else if (collection) {
          const r = await apiRequest<{ puzzles: Puzzle[] }>(`/api/puzzles/collections/${collection}/puzzles`, { token });
          setPuzzles(r.puzzles);
          setMessage({ text: 'Collection loaded.', kind: 'neutral' });
        } else {
          const r = await apiRequest<{ puzzles: Puzzle[] }>('/api/puzzles', { token });
          setPuzzles(r.puzzles);
          setMessage({ text: 'Practice queue ready.', kind: 'neutral' });
        }
      } catch (e) {
        setMessage({ text: e instanceof Error ? e.message : 'Failed to load puzzles', kind: 'error' });
      }
    })();
  }, [token, isDaily, collection]);

  /* reset when puzzle changes */
  useEffect(() => {
    if (!current) return;
    const c = new Chess(current.fen);
    setChess(c);
    setFen(current.fen);
    setMoveIndex(0);
    setWrong(0);
    setHintLevel(0);
    setSolved(false);
    setSubmitted(false);
    setLegalTargets([]);
    setLastMove(null);
    setMoveLog([]);
    setFlipped(sideToMove(current.fen) === 'black');
    setMessage({ text: 'Find the best move!', kind: 'neutral' });
  }, [current]);

  const boardOrientation = useMemo(() => {
    if (!current) return 'white';
    const base = sideToMove(current.fen);
    return (flipped ? (base === 'white' ? 'black' : 'white') : base) as 'white' | 'black';
  }, [current, flipped]);

  const hintArrow = useMemo((): Arrow[] => {
    if (!current || hintLevel === 0) return [];
    const expected = current.solutionMoves[moveIndex];
    if (!expected) return [];
    const p = parseUci(expected);
    if (hintLevel === 1) return [[p.from, p.from, 'rgba(45,212,191,0.7)'] as Arrow];
    return [[p.from, p.to, 'rgba(45,212,191,0.85)'] as Arrow];
  }, [hintLevel, current, moveIndex]);

  const hintText = useMemo(() => {
    if (!current || hintLevel === 0) return '';
    const expected = current.solutionMoves[moveIndex];
    if (!expected) return '';
    const p = parseUci(expected);
    if (hintLevel === 1) return `Move a piece from ${p.from.toUpperCase()}`;
    if (hintLevel >= 2) return `Move from ${p.from.toUpperCase()} → ${p.to.toUpperCase()}`;
    return '';
  }, [hintLevel, current, moveIndex]);

  const submitAttempt = useCallback(async (result: 'solved' | 'failed' | 'skipped' | 'revealed') => {
    if (!current || submitted) return;
    setSubmitted(true);
    try {
      await apiRequest('/api/attempts', {
        method: 'POST', token,
        body: JSON.stringify({ puzzleId: current.id, result, hintsUsed: hintLevel, retriesUsed: wrong, isDaily })
      });
    } catch { /* resilient */ }
  }, [current, submitted, token, hintLevel, wrong, isDaily]);

  const goNext = useCallback(() => {
    if (puzzles.length === 0) return;
    setIndex((p) => (p + 1) % puzzles.length);
  }, [puzzles.length]);

  const reset = useCallback(() => {
    if (!current) return;
    const c = new Chess(current.fen);
    setChess(c);
    setFen(current.fen);
    setMoveIndex(0); setWrong(0); setHintLevel(0);
    setSolved(false); setSubmitted(false);
    setLastMove(null); setMoveLog([]);
    setMessage({ text: 'Puzzle reset — try again!', kind: 'info' });
  }, [current]);

  const reveal = useCallback(() => {
    if (!current) return;
    const c = new Chess(fen);
    const log: Array<{ san: string; isPlayer: boolean }> = [...moveLog];
    for (let i = moveIndex; i < current.solutionMoves.length; i++) {
      const p = parseUci(current.solutionMoves[i]);
      const m = c.move({ from: p.from as never, to: p.to as never, promotion: p.promotion });
      if (!m) break;
      log.push({ san: m.san, isPlayer: false });
    }
    setFen(c.fen());
    setChess(c);
    setMoveLog(log);
    setSolved(true);
    setMessage({ text: 'Solution revealed.', kind: 'info' });
    void submitAttempt('revealed');
  }, [current, fen, moveIndex, moveLog, submitAttempt]);

  const skip = useCallback(() => {
    setMessage({ text: 'Puzzle skipped.', kind: 'neutral' });
    void submitAttempt('skipped');
    goNext();
  }, [submitAttempt, goNext]);

  const onDrop = useCallback((source: string, target: string) => {
    if (!current || solved) return false;
    const c = new Chess(fen);
    setLegalTargets([]);
    const legal = c.move({ from: source as never, to: target as never, promotion: 'q' });
    if (!legal) return false;

    const expected = current.solutionMoves[moveIndex];
    const played = `${source}${target}${legal.promotion || ''}`;

    if (played !== expected) {
      const nw = wrong + 1;
      setWrong(nw);
      // flash back
      if (nw >= 3) {
        setMessage({ text: 'Puzzle failed after 3 mistakes.', kind: 'error' });
        setSolved(true);
        void submitAttempt('failed');
      } else {
        setMessage({ text: `Incorrect — ${3 - nw} attempt${3 - nw !== 1 ? 's' : ''} remaining.`, kind: 'error' });
      }
      return false;
    }

    setLastMove({ from: source, to: target });

    // auto-play opponent replies
    let nextIdx = moveIndex + 1;
    const log: Array<{ san: string; isPlayer: boolean }> = [...moveLog, { san: legal.san, isPlayer: true }];
    while (nextIdx < current.solutionMoves.length && nextIdx % 2 === 1) {
      const p = parseUci(current.solutionMoves[nextIdx]);
      const reply = c.move({ from: p.from as never, to: p.to as never, promotion: p.promotion });
      if (!reply) break;
      log.push({ san: reply.san, isPlayer: false });
      setLastMove({ from: p.from, to: p.to });
      nextIdx++;
    }

    setFen(c.fen());
    setChess(c);
    setMoveLog(log);
    setMoveIndex(nextIdx);

    if (nextIdx >= current.solutionMoves.length) {
      setSolved(true);
      setMessage({ text: '✓ Brilliant! Puzzle solved.', kind: 'success' });
      void submitAttempt('solved');
    } else {
      setMessage({ text: 'Good move! Keep going…', kind: 'info' });
    }

    return true;
  }, [current, solved, fen, moveIndex, wrong, chess, moveLog, submitAttempt]);

  /* ── empty state ── */
  if (!current) {
    return (
      <section className="panel p-8 flex flex-col items-center gap-4">
        <div className="text-4xl">♟</div>
        <p className="text-slate-300 text-lg">{message.text}</p>
        {puzzles.length === 0 && message.text.includes('loaded') && (
          <p className="text-sm text-slate-500">No puzzles found. Make sure the server is running and seeded.</p>
        )}
      </section>
    );
  }

  /* ── square styles ── */
  const customSquareStyles: Record<string, CSSProperties> = {};
  legalTargets.forEach((sq) => {
    customSquareStyles[sq] = {
      background: 'radial-gradient(circle, rgba(45,212,191,0.5) 28%, rgba(45,212,191,0.12) 32%, transparent 38%)'
    };
  });
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(45,212,191,0.22)' };
    customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(45,212,191,0.38)' };
  }

  /* ── progress ── */
  const progressPct = puzzles.length > 1 ? Math.round(((index) / puzzles.length) * 100) : 0;
  const movesTotal = current.solutionMoves.filter((_, i) => i % 2 === 0).length;
  const movesDone = Math.floor(moveIndex / 2);
  const playerSide = sideToMove(current.fen);

  /* ── message styles ── */
  const msgStyles: Record<string, string> = {
    success: 'border-teal-500/50 bg-teal-900/30 text-teal-200',
    error: 'border-rose-500/50 bg-rose-900/30 text-rose-200',
    info: 'border-cyan-500/40 bg-cyan-900/20 text-cyan-200',
    neutral: 'border-slate-700/60 bg-slate-900/60 text-slate-300',
  };

  /* ── render ── */
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">

      {/* ── LEFT: board column ── */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">

        {/* top bar: puzzle counter + progress */}
        {puzzles.length > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 shrink-0">
              {index + 1} / {puzzles.length}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-800">
              <div
                className="h-1.5 rounded-full bg-teal-400/70 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* hero: side-to-move banner */}
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
          playerSide === 'white'
            ? 'bg-slate-100/8 border-slate-300/20'
            : 'bg-slate-900/60 border-slate-700/50'
        }`}>
          <div className={`w-6 h-6 rounded-full border-2 shadow flex-shrink-0 ${
            playerSide === 'white'
              ? 'bg-slate-100 border-slate-400'
              : 'bg-slate-900 border-slate-400'
          }`} />
          <div>
            <p className="text-slate-100 font-semibold leading-tight text-sm">
              {playerSide === 'white' ? 'White' : 'Black'} to move
            </p>
            <p className="text-slate-400 text-xs">Find the best move for {playerSide}</p>
          </div>
          {/* move progress pips */}
          {movesTotal > 1 && (
            <div className="ml-auto flex gap-1 items-center">
              {Array.from({ length: movesTotal }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i < movesDone ? 'bg-teal-400' : i === movesDone ? 'bg-teal-400/50 animate-pulse' : 'bg-slate-700'
                  }`}
                />
              ))}
              <span className="ml-1 text-xs text-slate-500">{movesDone}/{movesTotal}</span>
            </div>
          )}
        </div>

        {/* board */}
        <div ref={boardContainerRef} className="w-full">
          <Chessboard
            id="practice-board"
            boardWidth={boardSize}
            position={fen}
            boardOrientation={boardOrientation}
            onPieceDrop={onDrop}
            onPieceDragBegin={(_, sq) => {
              const c = new Chess(fen);
              setLegalTargets(c.moves({ square: sq as never, verbose: true }).map((m) => m.to));
            }}
            onPieceDragEnd={() => setLegalTargets([])}
            customSquareStyles={customSquareStyles}
            customArrows={hintArrow}
            customDarkSquareStyle={{ backgroundColor: '#2d4a6b' }}
            customLightSquareStyle={{ backgroundColor: '#b8cde0' }}
            animationDuration={160}
          />
        </div>

        {/* below-board controls */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>{boardOrientation === 'white' ? 'White at bottom' : 'Black at bottom'}</span>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/70 transition"
          >
            ⇅ Flip board
          </button>
        </div>
      </div>

      {/* ── RIGHT: info panel ── */}
      <div className="flex flex-col gap-3 w-full lg:w-[300px] xl:w-[320px] shrink-0">

        {/* puzzle info card */}
        <article className="panel p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-base font-bold text-slate-100 leading-tight">{current.title}</h1>
            <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-xs font-bold ${ratingColor(current.rating)}`}>
              {current.rating}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">{current.description}</p>

          <div className="flex items-center gap-2 text-xs">
            <span className={`rounded-md border px-2 py-0.5 font-semibold ${ratingColor(current.rating)}`}>
              {ratingLabel(current.rating)}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {current.themes.map((t) => (
              <span key={t} className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${themeColor(t)}`}>
                {t}
              </span>
            ))}
          </div>
        </article>

        {/* status message */}
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${msgStyles[message.kind]}`}>
          {message.text}
          {hintText && (
            <p className="mt-1 text-xs text-cyan-300 font-normal">💡 {hintText}</p>
          )}
        </div>

        {/* attempt tracker */}
        <div className="panel px-4 py-3 flex items-center gap-3">
          <span className="text-xs text-slate-500 shrink-0">Attempts</span>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full border transition-all ${
                  i < wrong
                    ? 'bg-rose-500 border-rose-400'
                    : solved && message.kind === 'success'
                    ? 'bg-teal-500 border-teal-400'
                    : 'bg-slate-800 border-slate-600'
                }`}
              />
            ))}
          </div>
          {wrong > 0 && !solved && (
            <span className="ml-auto text-xs text-rose-400">{3 - wrong} left</span>
          )}
          {solved && message.kind === 'success' && (
            <span className="ml-auto text-xs text-teal-400">Solved!</span>
          )}
        </div>

        {/* move notation log */}
        {moveLog.length > 0 && (
          <article className="panel p-3">
            <p className="text-[10px] uppercase text-slate-500 font-semibold mb-2 tracking-widest">Move log</p>
            <div className="flex flex-wrap gap-1.5">
              {moveLog.map((m, i) => (
                <span
                  key={i}
                  className={`rounded px-2 py-0.5 text-xs font-mono font-semibold border ${
                    m.isPlayer
                      ? 'bg-teal-900/40 text-teal-200 border-teal-600/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/40'
                  }`}
                >
                  {Math.floor(i / 2) + 1}{i % 2 === 0 ? '.' : '…'} {m.san}
                </span>
              ))}
            </div>
          </article>
        )}

        {/* action buttons */}
        <article className="panel p-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn-secondary flex items-center justify-center gap-1.5 col-span-2 py-2.5"
            onClick={() => setHintLevel((h) => Math.min(2, h + 1))}
            disabled={hintLevel >= 2 || solved}
          >
            💡 {hintLevel === 0 ? 'Get a Hint' : hintLevel === 1 ? 'More Hint' : 'Hint used'}
          </button>
          <button type="button" className="btn-secondary py-2" onClick={reset}>↺ Retry</button>
          <button type="button" className="btn-secondary py-2" onClick={skip}>⏭ Skip</button>
          <button
            type="button"
            className="btn-danger col-span-2 py-2"
            onClick={reveal}
            disabled={solved}
          >
            Show Solution
          </button>
          {solved && (
            <button
              type="button"
              className="btn-primary col-span-2 py-2.5 font-bold"
              onClick={goNext}
            >
              Next Puzzle →
            </button>
          )}
        </article>

        {/* puzzle metadata footer */}
        <p className="text-center text-[10px] text-slate-600 px-2">
          Puzzle #{current.id} · {current.solutionMoves.length} move{current.solutionMoves.length !== 1 ? 's' : ''} in solution
        </p>
      </div>
    </div>
  );
}
