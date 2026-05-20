import type { ReactNode } from 'react';
import type { Application } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { resolveRejectionReason } from '../../utils/applicationStatusDisplay';

type Props = {
  application: Application;
  title: string;
  subtitle?: string | null;
  /** Third line (e.g. job title in pipeline lists). */
  detail?: string | null;
  /** Extra badges beside status (e.g. AI progress). */
  badgeExtra?: ReactNode;
  actions: ReactNode;
  /** `card` = app-card; `compact` = bordered row in collapsible lists. */
  variant?: 'card' | 'compact';
};

export function ApplicationListRow({
  application,
  title,
  subtitle,
  detail,
  badgeExtra,
  actions,
  variant = 'card',
}: Props) {
  const shellClass =
    variant === 'card'
      ? 'app-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
      : 'flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between';

  return (
    <li className={shellClass}>
      <div className="min-w-0 text-left">
        <p className="font-semibold text-slate-900">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        {detail ? <p className="mt-1 text-xs text-slate-600">{detail}</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge
            status={application.status}
            rejectionReason={resolveRejectionReason(application)}
          />
          {badgeExtra}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">{actions}</div>
    </li>
  );
}
