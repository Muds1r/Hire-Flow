import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-surface via-white to-mint-light px-4 py-12">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-mint/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-navy/10 blur-3xl"
        aria-hidden
      />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}

export function GuestLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuthStore();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <AuthShell>{children}</AuthShell>;
}

export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
