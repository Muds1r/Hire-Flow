import type { ReactNode } from 'react';
import { AuthBranding } from '../AuthBranding';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthFormCard({ title, subtitle, children, footer }: Props) {
  return (
    <div className="app-card !p-8 shadow-xl shadow-slate-300/30 ring-0">
      <AuthBranding title={title} subtitle={subtitle} />
      {children}
      {footer}
    </div>
  );
}
