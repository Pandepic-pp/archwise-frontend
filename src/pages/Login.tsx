import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, guestLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await guestLogin();
      navigate('/');
    } catch {
      setError('Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          {/* <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-brand-600 mb-4 text-2xl">
            🏗️
          </div> */}
          <h1 className="text-2xl font-bold text-white">ArchWise</h1>
          <p className="text-gray-400 text-sm mt-1">AI-Powered HLD Interview Simulator</p>
        </div>

        {/* Mode Tabs */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
          <div className="flex border-b border-surface-600">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-surface-700 text-white border-b-2 border-brand-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Guest mode */}
        {/* <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 mb-2">Just want to try it out?</p>
          <button
            onClick={handleGuest}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl border border-surface-500 text-gray-300 hover:bg-surface-700 text-sm font-medium transition-colors"
          >
            Continue as Guest (Demo Mode)
          </button>
        </div> */}
      </div>
    </div>
  );
}
