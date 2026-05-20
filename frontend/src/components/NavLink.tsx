import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-white/80 hover:text-navy"
    >
      {children}
    </Link>
  );
}
