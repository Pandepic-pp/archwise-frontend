import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  emailVerified: boolean;
}

interface Totals {
  totalTokens: number;
  totalCostUsd: number;
  totalCalls: number;
}

interface UsageByType {
  _id: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCostUsd: number;
  totalCalls: number;
  visionCalls: number;
  avgTokensPerCall: number;
}

interface RecentCall {
  _id: string;
  callType: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  isVisionCall: boolean;
  sessionId: string;
  createdAt: string;
}

interface Session {
  _id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  questionId?: { title: string; difficulty: string } | string;
}

interface UserDetailData {
  user: UserInfo;
  totals: Totals;
  usageByType: UsageByType[];
  sessions: Session[];
  recentCalls: RecentCall[];
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtCost(usd: number): string {
  if (usd === 0) return '$0.00';
  if (usd < 0.001) return `$${usd.toFixed(6)}`;
  if (usd < 0.01) return `$${usd.toFixed(5)}`;
  if (usd < 1) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const CALL_TYPE_LABELS: Record<string, string> = {
  interviewer_response: 'Interviewer Response',
  follow_ups: 'Follow-Up Gen',
  diagram_discussion: 'Diagram Discussion',
  evaluation: 'Session Evaluation',
};

const CALL_TYPE_COLORS: Record<string, string> = {
  interviewer_response: 'text-brand-400 bg-brand-500/10 border-brand-500/30',
  follow_ups: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  diagram_discussion: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
  evaluation: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-green-400 bg-green-500/10 border-green-500/30',
  active: 'text-brand-400 bg-brand-500/10 border-brand-500/30',
  evaluating: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  followUp: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  finalAnswer: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  pending: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    adminApi.userDetail(userId)
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load user data.'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading user data…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-8 max-w-md text-center space-y-4">
          <p className="font-medium">{error || 'User not found.'}</p>
          <button onClick={() => navigate('/admin')} className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { user, totals, usageByType, sessions, recentCalls } = data;
  const maxCostByType = Math.max(...usageByType.map((r) => r.totalCostUsd), 0.000001);

  return (
    <div className="min-h-screen bg-surface-900 text-white">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="border-b border-surface-700 px-4 sm:px-6 py-3.5 flex items-center gap-3 sticky top-0 bg-surface-900 z-10">
        <button
          onClick={() => navigate('/admin')}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          ← Dashboard
        </button>
        <span className="text-surface-500">/</span>
        <Link to="/admin/users" className="text-xs text-gray-400 hover:text-white transition-colors">
          Users
        </Link>
        <span className="text-surface-500">/</span>
        <span className="text-xs text-gray-300 truncate max-w-[200px]">{user.email}</span>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ── User Header ─────────────────────────────────────────────────── */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-brand-400">
                {(user.name || user.email)[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-white">{user.name || 'Unnamed User'}</h1>
              <p className="text-sm text-gray-400">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full border bg-surface-700 border-surface-500 text-gray-400">
                  {user.role}
                </span>
                {user.emailVerified && (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-green-500/10 border-green-500/30 text-green-400">
                    verified
                  </span>
                )}
                <span className="text-xs text-gray-600">Joined {fmtDate(user.createdAt)}</span>
              </div>
            </div>
            {/* Total stats */}
            <div className="flex gap-4 sm:gap-6 shrink-0">
              <div className="text-center">
                <p className="text-xl font-bold text-amber-400">{fmtCost(totals.totalCostUsd)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Spend</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-brand-400">{fmtTokens(totals.totalTokens)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Tokens</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-400">{totals.totalCalls}</p>
                <p className="text-xs text-gray-500 mt-0.5">API Calls</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Usage by Call Type */}
          <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-600">
              <h2 className="text-sm font-semibold text-white">Usage by Call Type</h2>
            </div>
            {usageByType.length === 0 ? (
              <p className="text-gray-500 text-sm px-5 py-6 text-center">No usage recorded.</p>
            ) : (
              <div className="divide-y divide-surface-700">
                {usageByType.map((row) => {
                  const barPct = (row.totalCostUsd / maxCostByType) * 100;
                  const colorClass = CALL_TYPE_COLORS[row._id] ?? 'text-gray-300 bg-gray-500/10 border-gray-500/30';
                  return (
                    <div key={row._id} className="px-5 py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass}`}>
                          {CALL_TYPE_LABELS[row._id] ?? row._id}
                        </span>
                        <span className="text-sm font-semibold text-white">{fmtCost(row.totalCostUsd)}</span>
                      </div>
                      <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500/70 rounded-full" style={{ width: `${barPct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{row.totalCalls} calls · {row.visionCalls} vision</span>
                        <span>avg {Math.round(row.avgTokensPerCall).toLocaleString()} tokens</span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>In: {fmtTokens(row.promptTokens)}</span>
                        <span>Out: {fmtTokens(row.completionTokens)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sessions */}
          <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-600">
              <h2 className="text-sm font-semibold text-white">Recent Sessions</h2>
            </div>
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-sm px-5 py-6 text-center">No sessions found.</p>
            ) : (
              <div className="divide-y divide-surface-700">
                {sessions.map((s) => {
                  const statusColor = STATUS_COLORS[s.status] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/30';
                  const questionTitle =
                    typeof s.questionId === 'object' && s.questionId
                      ? s.questionId.title
                      : 'Unknown Question';
                  return (
                    <div key={s._id} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{questionTitle}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{fmtDateTime(s.startedAt)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusColor}`}>
                        {s.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Recent API Calls ─────────────────────────────────────────────── */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-600 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent API Calls</h2>
            <span className="text-xs text-gray-500">Last 50</span>
          </div>
          {recentCalls.length === 0 ? (
            <p className="text-gray-500 text-sm px-5 py-6 text-center">No calls recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700">
                    <th className="text-left text-xs text-gray-500 font-medium px-5 py-2.5">Type</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-3 py-2.5">In</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-3 py-2.5">Out</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-3 py-2.5">Cost</th>
                    <th className="text-center text-xs text-gray-500 font-medium px-3 py-2.5">Vision</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-5 py-2.5">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700">
                  {recentCalls.map((call) => {
                    const colorClass = CALL_TYPE_COLORS[call.callType] ?? 'text-gray-300 bg-transparent border-transparent';
                    return (
                      <tr key={call._id} className="hover:bg-surface-750 transition-colors">
                        <td className="px-5 py-2.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${colorClass}`}>
                            {CALL_TYPE_LABELS[call.callType] ?? call.callType}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-400 font-mono">
                          {call.promptTokens.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-400 font-mono">
                          {call.completionTokens.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-amber-400 font-mono">
                          {fmtCost(call.estimatedCostUsd)}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs">
                          {call.isVisionCall
                            ? <span className="text-purple-400">👁️</span>
                            : <span className="text-gray-700">—</span>}
                        </td>
                        <td className="px-5 py-2.5 text-right text-xs text-gray-500 whitespace-nowrap">
                          {fmtDateTime(call.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
