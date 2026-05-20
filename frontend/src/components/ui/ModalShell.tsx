import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  titleId: string;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
  contentClassName?: string;
};

export function ModalShell({
  open,
  titleId,
  title,
  description,
  onClose,
  closeDisabled = false,
  footer,
  children,
  maxWidthClass = 'max-w-lg',
  contentClassName,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={() => !closeDisabled && onClose()}
      />
      <div
        className={`relative flex max-h-[min(92vh,900px)] w-full flex-col ${maxWidthClass} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-100`}
      >
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 id={titleId} className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          {description ? <div className="mt-1 text-sm text-slate-600">{description}</div> : null}
        </div>
        <div
          className={
            contentClassName ??
            'max-h-[min(55vh,480px)] overflow-y-auto px-6 py-4'
          }
        >
          {children}
        </div>
        {footer ? (
          <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
