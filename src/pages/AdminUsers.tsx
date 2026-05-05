import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';

interface UserRow {
  userId: string;
  name: string;
  email: string;
  joinedAt: string;
  totalTokens: number;
  totalCostUsd: number;
  totalCalls: number;
  visionCalls: number;
  lastActivity: string;
  sessions?: { total: number; completed: number };
}

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
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.users()
      .then((res) => setUsers(res.data.data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading users…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900 text-white">

      {/* Navbar */}
      <nav className="border-b border-surface-700 px-4 sm:px-6 py-3.5 flex items-center gap-3 sticky top-0 bg-surface-900 z-10">
        <button
          onClick={() => navigate('/admin')}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          ← Dashboard
        </button>
        <span className="text-surface-500">/</span>
        <span className="text-xs font-medium text-gray-300">All Users</span>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-white">Users</h1>
            <p className="text-xs text-gray-500 mt-0.5">{users.length} users ranked by total spend</p>
          </div>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface-700 border border-surface-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 w-64"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-sm px-5 py-8 text-center">
              {search ? 'No users match your search.' : 'No usage data recorded yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700">
                    <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">#</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-3 py-3">User</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-3 py-3">Spend</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-3 py-3">Tokens</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-3 py-3">Calls</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-3 py-3">Vision</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-3 py-3">Sessions</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-3 py-3">Joined</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-5 py-3">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700">
                  {filtered.map((u, i) => (
                    <tr key={u.userId} className="hover:bg-surface-750 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-600 font-mono">{i + 1}</td>
                      <td className="px-3 py-3">
                        <Link
                          to={`/admin/users/${u.userId}`}
                          className="block hover:text-brand-400 transition-colors"
                        >
                          <p className="text-sm font-medium text-white">{u.name || '—'}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-semibold text-amber-400 font-mono">
                        {fmtCost(u.totalCostUsd)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-gray-400 font-mono">
                        {fmtTokens(u.totalTokens)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-gray-400">
                        {u.totalCalls}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-purple-400">
                        {u.visionCalls > 0 ? u.visionCalls : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-gray-400">
                        {u.sessions
                          ? `${u.sessions.total} / ${u.sessions.completed} done`
                          : '—'}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-gray-500 whitespace-nowrap">
                        {u.joinedAt ? fmtDate(u.joinedAt) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-gray-500 whitespace-nowrap">
                        {u.lastActivity ? fmtDate(u.lastActivity) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
