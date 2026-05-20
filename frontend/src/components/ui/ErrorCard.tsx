import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  message: string;
  detail?: ReactNode;
  backTo?: string;
  backLabel?: string;
};

export function ErrorCard({ message, detail, backTo, backLabel = 'Go back' }: Props) {
  return (
    <div className="app-card border-red-200 bg-red-50/50 text-red-800">
      <p className="font-medium">{message}</p>
      {detail ? <div className="mt-1 text-sm text-red-700/90">{detail}</div> : null}
      {backTo ? (
        <Link className="link-muted mt-3 inline-block" to={backTo}>
          {backLabel}
        </Link>
      ) : null}
    </div>
  );
}
