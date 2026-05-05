import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const learnActive = location.pathname.startsWith('/learn');

  return (
    <nav className="border-b border-surface-700 px-4 sm:px-6 py-3.5">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <Link to="/practice" className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-white">ArchWise</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">beta</span>
        </Link>

        <div className="order-3 sm:order-2 w-full sm:w-auto flex items-center gap-2">
          <NavLink
            to="/practice"
            className={({ isActive }) =>
              `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive || location.pathname === '/'
                  ? 'bg-brand-500/10 text-brand-300 border border-brand-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-surface-800 border border-transparent'
              }`
            }
          >
            Practice
          </NavLink>

          <div className="relative group">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                learnActive
                  ? 'bg-brand-500/10 text-brand-300 border-brand-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-surface-800 border-transparent'
              }`}
            >
              Learn
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className="absolute left-0 top-full z-20 pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
              <div className="w-44 rounded-xl border border-surface-600 bg-surface-800 shadow-xl overflow-hidden">
                <Link to="/learn/hld" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-surface-700 transition-colors">
                  HLD
                </Link>
                <Link to="/learn/lld" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-surface-700 transition-colors">
                  LLD
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="order-2 sm:order-3 flex items-center gap-3 shrink-0">
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
      </div>
    </nav>
  );
}
