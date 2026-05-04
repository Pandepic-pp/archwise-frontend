import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import PasswordInput from '../components/common/PasswordInput';

type Tab = 'login' | 'register';
type RegisterStep = 'form' | 'otp';

export default function Login() {
  const [tab, setTab] = useState<Tab>('login');

  // ── Login state ──────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Register state ───────────────────────────────────────────────────────
  const [regStep, setRegStep] = useState<RegisterStep>('form');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  // ── Login submit ─────────────────────────────────────────────────────────
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Authentication failed';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Register: send OTP ───────────────────────────────────────────────────
  const handleRegisterRequest = async (e: FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      await authApi.register({ name: regName, email: regEmail, password: regPassword });
      setRegStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send verification code';
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  // ── Register: verify OTP → auto-login ────────────────────────────────────
  const handleOtpVerify = async (e: FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      const res = await authApi.registerVerify({ email: regEmail, otp: regOtp });
      loginWithToken(res.data.token, res.data.user);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Verification failed';
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setLoginError('');
    setRegError('');
    setRegStep('form');
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">ArchWise</h1>
          <p className="text-gray-400 text-sm mt-1">AI-Powered HLD Interview Simulator</p>
        </div>

        <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-surface-600">
            {([['login', 'Sign In'], ['register', 'Register']] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'bg-surface-700 text-white border-b-2 border-brand-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Sign In ─────────────────────────────────────────────────── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Password</label>
                <PasswordInput
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* ── Register ─────────────────────────────────────────────────── */}
          {tab === 'register' && (
            <div className="p-6">

              {/* Step 1: Registration form */}
              {regStep === 'form' && (
                <form onSubmit={handleRegisterRequest} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Jane Smith"
                      required
                      className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Password</label>
                    <PasswordInput
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>

                  {regError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                      {regError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {regLoading ? 'Sending code…' : 'Create Account'}
                  </button>
                </form>
              )}

              {/* Step 2: OTP verification */}
              {regStep === 'otp' && (
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div className="text-center mb-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-600/20 border border-brand-500/30 mb-3">
                      <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-white text-sm font-medium">Check your inbox</p>
                    <p className="text-gray-400 text-xs mt-1">
                      We sent a 6-digit code to <span className="text-gray-300">{regEmail}</span>
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Verification Code</label>
                    <input
                      type="text"
                      value={regOtp}
                      onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      required
                      maxLength={6}
                      inputMode="numeric"
                      className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm text-center tracking-[0.5em] font-mono text-lg"
                    />
                  </div>

                  {regError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                      {regError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={regLoading || regOtp.length < 6}
                    className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {regLoading ? 'Verifying…' : 'Verify & Sign In'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRegStep('form'); setRegError(''); setRegOtp(''); }}
                    className="w-full text-gray-500 hover:text-gray-300 text-xs transition-colors"
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
