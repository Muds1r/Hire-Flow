import { Outlet, useLocation } from 'react-router-dom';
import { RoleSubNav } from '../components/layout/RoleSubNav';

function evalTrailLabel(pathname: string): string | null {
  if (pathname === '/eval') return null;
  if (pathname.includes('/configure')) return 'Configure assessment';
  if (pathname.startsWith('/eval/tests/')) return 'Assessment review';
  return null;
}

export function EvalLayout() {
  const { pathname } = useLocation();

  return (
    <div className="space-y-8">
      <RoleSubNav
        ariaLabel="Evaluator navigation"
        rootLabel="Evaluator home"
        rootTo="/eval"
        trail={evalTrailLabel(pathname)}
      />
      <Outlet />
    </div>
  );
}
