import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiGroup {
  totalTokens: number;
  totalCostUsd: number;
  totalCalls: number;
  visionCalls: number;
}

interface CallTypeRow {
  _id: string;
  totalTokens: number;
  totalCostUsd: number;
  totalCalls: number;
  avgTokensPerCall: number;
}

interface TopUser {
  userId: string;
  name: string;
  email: string;
  totalTokens: number;
  totalCostUsd: number;
  totalCalls: number;
  visionCalls: number;
  lastActivity: string;
}

interface DailyEntry {
  _id: string;
  totalTokens: number;
  totalCostUsd: number;
  totalCalls: number;
}

interface DashboardData {
  overall: KpiGroup;
  monthly: KpiGroup;
  byCallType: CallTypeRow[];
  topUsers: TopUser[];
  dailyUsage: DailyEntry[];
  counts: { users: number; sessions: number; sessionsLast24h: number };
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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CALL_TYPE_LABELS: Record<string, string> = {
  interviewer_response: 'Interviewer Response',
  follow_ups: 'Follow-Up Generation',
  diagram_discussion: 'Diagram Discussion',
  evaluation: 'Session Evaluation',
};

const CALL_TYPE_COLORS: Record<string, string> = {
  interviewer_response: 'text-brand-400',
  follow_ups: 'text-purple-400',
  diagram_discussion: 'text-teal-400',
  evaluation: 'text-amber-400',
};

const CALL_TYPE_BAR_COLORS: Record<string, string> = {
  interviewer_response: 'bg-brand-600',
  follow_ups: 'bg-purple-600',
  diagram_discussion: 'bg-teal-600',
  evaluation: 'bg-amber-600',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.dashboard()
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load dashboard data. Ensure your account has admin access.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-8 max-w-md text-center space-y-4">
          <p className="text-2xl">⚠️</p>
          <p className="font-medium">{error || 'No data available.'}</p>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to App
          </button>
        </div>
      </div>
    );
  }

  const maxDailyCost = Math.max(...data.dailyUsage.map((d) => d.totalCostUsd), 0.000001);

  return (
    <div className="min-h-screen bg-surface-900 text-white">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="border-b border-surface-700 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 bg-surface-900 z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold tracking-tight text-white">ArchWise</span>
          <span className="text-surface-500">/</span>
          <span className="text-sm font-medium text-gray-400">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/admin/users"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            All Users
          </Link>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            ← Back to App
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* ── Platform Counts ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Total Users', value: data.counts.users, icon: '👤' },
            { label: 'Total Sessions', value: data.counts.sessions, icon: '🎯' },
            { label: 'Sessions (24h)', value: data.counts.sessionsLast24h, icon: '⚡' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              <div>
                <p className="text-lg font-bold text-white leading-none">{value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── All-time KPIs ────────────────────────────────────────────────── */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">All Time</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Spend', value: fmtCost(data.overall.totalCostUsd), icon: '💰', accent: 'text-amber-400' },
              { label: 'Tokens Used', value: fmtTokens(data.overall.totalTokens), icon: '🔢', accent: 'text-brand-400' },
              { label: 'API Calls', value: data.overall.totalCalls.toLocaleString(), icon: '📡', accent: 'text-green-400' },
              {
                label: 'Vision Calls',
                value: data.overall.visionCalls.toLocaleString(),
                icon: '👁️',
                accent: 'text-purple-400',
                sub: data.overall.totalCalls > 0
                  ? `${((data.overall.visionCalls / data.overall.totalCalls) * 100).toFixed(1)}% of calls`
                  : '—',
              },
            ].map(({ label, value, icon, accent, sub }) => (
              <div key={label} className="bg-surface-800 rounded-2xl border border-surface-600 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{icon}</span>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
                <p className={`text-2xl font-bold ${accent}`}>{value}</p>
                {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* ── 30-Day KPIs ─────────────────────────────────────────────────── */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Last 30 Days</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Spend', value: fmtCost(data.monthly.totalCostUsd), accent: 'text-amber-400' },
              { label: 'Tokens', value: fmtTokens(data.monthly.totalTokens), accent: 'text-brand-400' },
              { label: 'Calls', value: data.monthly.totalCalls.toLocaleString(), accent: 'text-green-400' },
              { label: 'Vision Calls', value: data.monthly.visionCalls.toLocaleString(), accent: 'text-purple-400' },
            ].map(({ label, value, accent }) => (
              <div key={label} className="bg-surface-800 border border-surface-600 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-xl font-bold ${accent} mt-0.5`}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Main Two-Column ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Users */}
          <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-surface-600">
              <h2 className="text-sm font-semibold text-white">Top Users by Spend</h2>
            </div>
            {data.topUsers.length === 0 ? (
              <p className="text-gray-500 text-sm px-5 py-6 text-center">No usage recorded yet.</p>
            ) : (
              <div className="divide-y divide-surface-700 flex-1">
                {data.topUsers.map((u, i) => (
                  <Link
                    key={u.userId}
                    to={`/admin/users/${u.userId}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-surface-750 transition-colors"
                  >
                    <span className="text-xs text-gray-600 w-4 shrink-0 font-mono">#{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{u.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-amber-400">{fmtCost(u.totalCostUsd)}</p>
                      <p className="text-xs text-gray-600">{u.totalCalls} calls</p>
                    </div>
                    <span className="text-gray-600 text-xs shrink-0">→</span>
                  </Link>
                ))}
              </div>
            )}
            <div className="px-5 py-3 border-t border-surface-700">
              <Link to="/admin/users" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                View all users →
              </Link>
            </div>
          </div>

          {/* Call Type Breakdown */}
          <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-600">
              <h2 className="text-sm font-semibold text-white">Spend by Call Type</h2>
            </div>
            {data.byCallType.length === 0 ? (
              <p className="text-gray-500 text-sm px-5 py-6 text-center">No usage recorded yet.</p>
            ) : (
              <div className="divide-y divide-surface-700">
                {data.byCallType.map((row) => {
                  const pct =
                    data.overall.totalCostUsd > 0
                      ? (row.totalCostUsd / data.overall.totalCostUsd) * 100
                      : 0;
                  const barColor = CALL_TYPE_BAR_COLORS[row._id] ?? 'bg-gray-600';
                  const labelColor = CALL_TYPE_COLORS[row._id] ?? 'text-gray-300';
                  return (
                    <div key={row._id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${labelColor}`}>
                          {CALL_TYPE_LABELS[row._id] ?? row._id}
                        </span>
                        <span className="text-sm font-semibold text-white">{fmtCost(row.totalCostUsd)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${pct.toFixed(1)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-9 text-right">{pct.toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {row.totalCalls} calls · avg {Math.round(row.avgTokensPerCall).toLocaleString()} tokens/call
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Daily Spend Chart ────────────────────────────────────────────── */}
        {data.dailyUsage.length > 0 && (
          <section className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-600 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Daily Spend — Last 30 Days</h2>
              <span className="text-xs text-gray-500">
                Peak {fmtCost(maxDailyCost)} ·{' '}
                Total {fmtCost(data.monthly.totalCostUsd)}
              </span>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-end gap-1" style={{ height: '120px' }}>
                {data.dailyUsage.map((day) => {
                  const heightPct = (day.totalCostUsd / maxDailyCost) * 100;
                  return (
                    <div
                      key={day._id}
                      className="group relative flex-1 flex items-end"
                      style={{ height: '100%' }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 pointer-events-none">
                        <div className="bg-surface-700 border border-surface-500 rounded-lg px-2.5 py-1.5 text-center whitespace-nowrap shadow-xl">
                          <p className="text-xs font-semibold text-amber-400">{fmtCost(day.totalCostUsd)}</p>
                          <p className="text-xs text-gray-500">{fmtDate(day._id)}</p>
                          <p className="text-xs text-gray-600">{day.totalCalls} calls</p>
                        </div>
                      </div>
                      {/* Bar */}
                      <div
                        className="w-full bg-brand-600 hover:bg-brand-500 rounded-t transition-colors cursor-default"
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-600">{fmtDate(data.dailyUsage[0]._id)}</span>
                <span className="text-xs text-gray-600">{fmtDate(data.dailyUsage[data.dailyUsage.length - 1]._id)}</span>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
