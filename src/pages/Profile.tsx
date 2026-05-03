import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Password change failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-900">

      {/* Nav */}
      <header className="border-b border-surface-700 bg-surface-800/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <span className="text-white font-semibold text-sm">ArchWise</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Profile header */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300 font-bold text-xl select-none">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">{user?.name}</h2>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-surface-700 border border-surface-500 text-gray-400 text-xs capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-600">
            <h3 className="text-white font-semibold text-sm">Change Password</h3>
            <p className="text-gray-500 text-xs mt-0.5">Update your account password</p>
          </div>

          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full bg-surface-700 border border-surface-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={6}
                className={`w-full bg-surface-700 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none text-sm ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-surface-500 focus:border-brand-500'
                }`}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl px-4 py-3">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!!confirmPassword && confirmPassword !== newPassword)}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-600">
            <h3 className="text-white font-semibold text-sm">Account</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">Sign out</p>
                <p className="text-gray-500 text-xs mt-0.5">Log out from this device</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
