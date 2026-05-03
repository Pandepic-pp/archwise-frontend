import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { questionApi, sessionApi } from '../services/api';
import { Question, InterviewSession } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DIFFICULTY_RANK: Record<string, number> = { medium: 1, hard: 2, expert: 3 };

const difficultyColors = {
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  hard: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  expert: 'text-red-400 bg-red-500/10 border-red-500/30',
};

// ── Inline Toast ───────────────────────────────────────────────────────────────
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 bg-surface-800 border border-amber-500/40 text-amber-300 rounded-2xl px-4 py-3.5 shadow-xl max-w-sm w-[calc(100vw-2rem)] animate-fade-in-up">
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9a3 3 0 0 1 5.25 1.5c0 1.5-2.25 2.25-2.25 3.75M12 18h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{message}</p>
        <p className="text-xs text-amber-400/60 mt-0.5">Switch to a laptop or desktop to continue.</p>
      </div>
      <button onClick={onDismiss} className="shrink-0 text-amber-400/50 hover:text-amber-300 transition-colors mt-0.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function isLaptopOrLarger() {
  return window.innerWidth >= 1024;
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [recentSessions, setRecentSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'none' | 'asc' | 'desc'>('none');
  const [toast, setToast] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const dismissToast = useCallback(() => setToast(''), []);

  const filteredQuestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = q
      ? questions.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.difficulty.toLowerCase().includes(q) ||
            item.tags.some((t) => t.toLowerCase().includes(q))
        )
      : [...questions];

    if (sortDir !== 'none') {
      result.sort((a, b) =>
        sortDir === 'asc'
          ? DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]
          : DIFFICULTY_RANK[b.difficulty] - DIFFICULTY_RANK[a.difficulty]
      );
    }
    return result;
  }, [questions, search, sortDir]);

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, sRes] = await Promise.all([questionApi.list(), sessionApi.list()]);
        setQuestions(qRes.data.questions);
        setRecentSessions(sRes.data.sessions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const guardScreen = () => {
    if (!isLaptopOrLarger()) {
      setToast('Interviews require a laptop or larger screen for the whiteboard and voice controls.');
      return false;
    }
    return true;
  };

  const handleStart = async (questionId: string) => {
    if (!guardScreen()) return;
    setStarting(questionId);
    try {
      const { data } = await sessionApi.create(questionId);
      navigate(`/interview/${data.sessionId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(null);
    }
  };

  const handleRandom = async () => {
    if (!guardScreen()) return;
    setStarting('random');
    try {
      const { data: q } = await questionApi.random();
      const { data: s } = await sessionApi.create(q.question._id);
      navigate(`/interview/${s.sessionId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading questions…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900">
      {toast && <Toast message={toast} onDismiss={dismissToast} />}

      {/* Nav */}
      <nav className="border-b border-surface-700 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-white">ArchWise</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">beta</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-sm text-gray-400 truncate max-w-[140px]">{user?.name}</span>
          <button
            onClick={() => navigate('/profile')}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Profile
          </button>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Hero */}
        <div className="bg-gradient-to-br from-brand-900/40 to-surface-800 rounded-2xl border border-brand-500/20 p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">HLD Interview Simulator</h1>
              <p className="text-gray-400 text-sm sm:text-base max-w-lg leading-relaxed">
                Practice system design interviews with an AI interviewer. Get real-time feedback,
                draw on the whiteboard, and receive detailed evaluations.
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
                {['Excalidraw Whiteboard', 'Voice Interaction', 'GPT-4o Evaluator', 'Real-time Feedback'].map((f) => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-surface-700 text-gray-300 border border-surface-500 whitespace-nowrap">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleRandom}
              disabled={starting === 'random'}
              className="sm:shrink-0 w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {starting === 'random' ? 'Starting…' : 'Random Question'}
            </button>
          </div>
        </div>

        {/* Questions Grid */}
        <div>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-white shrink-0">Choose a Question</h2>
              {search && (
                <span className="text-xs text-gray-500 shrink-0">
                  {filteredQuestions.length} of {questions.length}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, tag, difficulty…"
                  className="w-full bg-surface-800 border border-surface-600 rounded-xl pl-8 pr-8 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-xs"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort by difficulty */}
              <button
                onClick={() => setSortDir((d) => d === 'none' ? 'asc' : d === 'asc' ? 'desc' : 'none')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors shrink-0 ${
                  sortDir !== 'none'
                    ? 'border-brand-500/60 bg-brand-500/10 text-brand-400'
                    : 'border-surface-600 bg-surface-800 text-gray-400 hover:text-gray-200 hover:border-surface-500'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m8 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span className="hidden xs:inline">Difficulty</span>
                {sortDir === 'asc' && <span className="hidden sm:inline text-[10px] opacity-70">↑ easy first</span>}
                {sortDir === 'desc' && <span className="hidden sm:inline text-[10px] opacity-70">↓ hard first</span>}
                {sortDir === 'asc' && <span className="sm:hidden text-[10px]">↑</span>}
                {sortDir === 'desc' && <span className="sm:hidden text-[10px]">↓</span>}
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredQuestions.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-gray-500 text-sm">
                No questions match <span className="text-gray-400">"{search}"</span>
              </div>
            ) : null}
            {filteredQuestions.map((q) => (
              <div
                key={q._id}
                className="bg-surface-800 rounded-2xl border border-surface-600 p-4 sm:p-5 hover:border-surface-500 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
                  <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-brand-400 transition-colors">
                    {q.title}
                  </h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${difficultyColors[q.difficulty]}`}>
                    {q.difficulty}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">{q.prompt}</p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex flex-wrap gap-1">
                    {q.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded-md bg-surface-700 text-gray-500">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500">⏱ {q.durationMinutes}m</span>
                    <button
                      onClick={() => handleStart(q._id)}
                      disabled={!!starting}
                      className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {starting === q._id ? 'Starting…' : 'Start'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3 sm:mb-4">Recent Sessions</h2>
            <div className="space-y-2">
              {recentSessions.slice(0, 5).map((s) => {
                const q = typeof s.questionId === 'object' ? s.questionId : null;
                return (
                  <div
                    key={s._id}
                    className="bg-surface-800 rounded-xl border border-surface-600 px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-sm text-gray-200 block truncate">{q?.title ?? 'Session'}</span>
                      <div className="flex flex-wrap gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                          s.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>{s.status}</span>
                        {s.evaluation && (
                          <span className="text-xs text-gray-500">Score: {s.evaluation.scores.overall}/100</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {s.status !== 'completed' && (
                        <button
                          onClick={() => navigate(`/interview/${s._id}`)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-brand-500/40 text-brand-400 hover:bg-brand-500/10 transition-colors whitespace-nowrap"
                        >
                          Resume
                        </button>
                      )}
                      {s.status === 'completed' && (
                        <button
                          onClick={() => navigate(`/results/${s._id}`)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-surface-500 text-gray-400 hover:bg-surface-700 transition-colors whitespace-nowrap"
                        >
                          View Results
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
