import { Outlet, useLocation } from 'react-router-dom';
import { RoleSubNav } from '../components/layout/RoleSubNav';

function hrTrailLabel(pathname: string): string | null {
  if (pathname === '/hr/pipeline') return 'Pipeline';
  if (pathname === '/hr/jobs') return 'Job posts';
  if (pathname === '/hr/evaluators') return 'Evaluators';
  if (pathname.startsWith('/hr/applications/')) return null;
  if (pathname.startsWith('/hr/jobs/')) return 'Job applicants';
  if (pathname.startsWith('/hr/tests/')) return 'Assessment result';
  return null;
}

export function HrLayout() {
  const { pathname } = useLocation();

  return (
    <div className="space-y-8">
      <RoleSubNav
        ariaLabel="HR navigation"
        rootLabel="HR desk"
        trail={hrTrailLabel(pathname)}
        tabs={[
          { to: '/hr/pipeline', label: 'Pipeline', end: true },
          { to: '/hr/jobs', label: 'Job posts', end: true },
          { to: '/hr/evaluators', label: 'Evaluators', end: true },
        ]}
      />
      <Outlet />
    </div>
  );
}
