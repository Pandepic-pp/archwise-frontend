import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { questionApi, sessionApi } from '../services/api';
import { Question, InterviewSession } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const difficultyColors = {
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  hard: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  expert: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [recentSessions, setRecentSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          questionApi.list(),
          sessionApi.list(),
        ]);
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

  const handleStart = async (questionId: string) => {
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
      {/* Nav */}
      <nav className="border-b border-surface-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏗️</span>
          <span className="font-bold text-white">SystemDesignAI</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">beta</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">👋 {user?.name}</span>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Hero */}
        <div className="bg-gradient-to-br from-brand-900/40 to-surface-800 rounded-2xl border border-brand-500/20 p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">HLD Interview Simulator</h1>
              <p className="text-gray-400 max-w-lg">
                Practice system design interviews with an AI interviewer. Get real-time feedback,
                draw on the whiteboard, and receive detailed evaluations.
              </p>
              <div className="flex gap-2 mt-4">
                {['Excalidraw Whiteboard', 'Voice Interaction', 'GPT-4o Evaluator', 'Real-time Feedback'].map((f) => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-surface-700 text-gray-300 border border-surface-500">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleRandom}
              disabled={starting === 'random'}
              className="shrink-0 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {starting === 'random' ? 'Starting…' : '🎲 Random Question'}
            </button>
          </div>
        </div>

        {/* Questions Grid */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Choose a Question</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q) => (
              <div
                key={q._id}
                className="bg-surface-800 rounded-2xl border border-surface-600 p-5 hover:border-surface-500 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-brand-400 transition-colors">
                    {q.title}
                  </h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${difficultyColors[q.difficulty]}`}>
                    {q.difficulty}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">{q.prompt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {q.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded-md bg-surface-700 text-gray-500">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
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
            <h2 className="text-lg font-semibold text-white mb-4">Recent Sessions</h2>
            <div className="space-y-2">
              {recentSessions.slice(0, 5).map((s) => {
                const q = typeof s.questionId === 'object' ? s.questionId : null;
                return (
                  <div
                    key={s._id}
                    className="bg-surface-800 rounded-xl border border-surface-600 px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm text-gray-200">{q?.title ?? 'Session'}</span>
                      <div className="flex gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                          s.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>{s.status}</span>
                        {s.evaluation && (
                          <span className="text-xs text-gray-500">Score: {s.evaluation.scores.overall}/100</span>
                        )}
                      </div>
                    </div>
                    {s.status !== 'completed' && (
                      <button
                        onClick={() => navigate(`/interview/${s._id}`)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-brand-500/40 text-brand-400 hover:bg-brand-500/10 transition-colors"
                      >
                        Resume
                      </button>
                    )}
                    {s.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/results/${s._id}`)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-surface-500 text-gray-400 hover:bg-surface-700 transition-colors"
                      >
                        View Results
                      </button>
                    )}
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
