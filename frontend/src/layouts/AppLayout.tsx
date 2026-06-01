import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { NavLink } from '../components/NavLink';
import { SiteLogo } from '../components/SiteLogo';

export function AppLayout() {
  const { user, ready, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const initial = (user.email?.[0] ?? '?').toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface via-white to-mint-light/50 text-navy">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 shadow-sm shadow-slate-200/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
          >
            <SiteLogo variant="header" className="transition-opacity group-hover:opacity-90" />
            <span className="hidden text-[11px] font-medium leading-tight text-slate-500 sm:flex sm:flex-col sm:border-l sm:border-slate-200 sm:pl-2.5">
              <span>Hire Flow</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            {user.role === 'CANDIDATE' && (
              <>
                <NavLink to="/jobs">Jobs</NavLink>
                <NavLink to="/applications">Applications</NavLink>
              </>
            )}
            {user.role === 'HR' && <NavLink to="/hr/pipeline">HR desk</NavLink>}
            {user.role === 'EVALUATOR' && <NavLink to="/eval">Evaluations</NavLink>}
            <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:inline" aria-hidden />
            <div className="flex items-center gap-2 pl-1">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 ring-1 ring-slate-200/80"
                title={user.email ?? ''}
              >
                {initial}
              </span>
              <span className="hidden max-w-[140px] truncate text-xs text-slate-500 sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                className="btn-secondary !py-1.5 !px-3 !text-xs"
                onClick={() => {
                  void logout().then(() => navigate('/login'));
                }}
              >
                Log out
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
