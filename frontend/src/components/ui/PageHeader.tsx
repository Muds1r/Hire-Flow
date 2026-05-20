import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, breadcrumb, className = '' }: Props) {
  return (
    <header className={className}>
      {breadcrumb}
      <h1 className={`page-title ${breadcrumb ? 'mt-2' : ''}`}>{title}</h1>
      {subtitle ? <div className="page-subtitle mt-1">{subtitle}</div> : null}
    </header>
  );
}
