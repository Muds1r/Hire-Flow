import { NavLink } from 'react-router-dom';

export type SubNavTab = {
  to: string;
  label: string;
  end?: boolean;
};

type Props = {
  ariaLabel: string;
  rootLabel: string;
  rootTo?: string;
  rootEnd?: boolean;
  trail: string | null;
  tabs?: SubNavTab[];
};

function sectionTabClass({ isActive }: { isActive: boolean }) {
  return [
    'rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
    isActive
      ? 'bg-mint text-navy shadow-[0_4px_14px_rgba(100,199,167,0.45)] ring-2 ring-mint-dark/35'
      : 'text-slate-600 hover:bg-mint-light/70 hover:text-navy',
  ].join(' ');
}

function evalHomeClass({ isActive }: { isActive: boolean }) {
  return [
    'rounded-lg px-2.5 py-1 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
    isActive
      ? 'bg-mint-light text-navy ring-1 ring-mint/30'
      : 'text-navy hover:bg-slate-50 hover:text-navy',
  ].join(' ');
}

export function RoleSubNav({
  ariaLabel,
  rootLabel,
  rootTo,
  rootEnd = true,
  trail,
  tabs,
}: Props) {
  return (
    <nav
      aria-label={ariaLabel}
      className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/40 ring-1 ring-slate-100 backdrop-blur-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <li>
            {rootTo ? (
              <NavLink to={rootTo} end={rootEnd} className={evalHomeClass}>
                {rootLabel}
              </NavLink>
            ) : (
              <span className="font-semibold text-slate-500">{rootLabel}</span>
            )}
          </li>
          {trail ? (
            <>
              <li aria-hidden className="select-none text-slate-300">
                /
              </li>
              <li className="font-medium text-slate-800">{trail}</li>
            </>
          ) : null}
        </ol>
        {tabs && tabs.length > 0 ? (
          <div
            className="hr-segmented flex flex-wrap gap-1"
            role="navigation"
            aria-label={`${ariaLabel} sections`}
          >
            {tabs.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.end ?? false} className={sectionTabClass}>
                {tab.label}
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
