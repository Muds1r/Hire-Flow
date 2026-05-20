import { useState, type ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: 'neutral' | 'muted' | 'danger';
  badge?: number | string;
  className?: string;
};

export function CollapsedSection({
  title,
  description,
  children,
  defaultOpen = false,
  tone = 'neutral',
  badge,
  className = 'mt-6',
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const borderTone =
    tone === 'danger'
      ? 'border-red-200/80 bg-red-50/30'
      : tone === 'muted'
        ? 'border-slate-200/80 bg-slate-50/50'
        : 'border-slate-200/80 bg-white/80';

  return (
    <section className={`app-card ${className} ${borderTone}`}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-navy">
            {title}
            {badge != null && (
              <span className="ml-2 rounded-full bg-mint-light px-2 py-0.5 text-xs font-bold text-navy ring-1 ring-mint/30">
                {badge}
              </span>
            )}
          </h2>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
        <span className="shrink-0 text-slate-400" aria-hidden>
          {open ? '▼' : '▶'}
        </span>
      </button>
      {open && (
        <div className="mt-4 border-t border-slate-200/80 pt-4">{children}</div>
      )}
    </section>
  );
}
