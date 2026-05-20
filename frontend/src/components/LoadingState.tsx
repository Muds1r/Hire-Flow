export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div
        className="h-11 w-11 animate-spin rounded-full border-2 border-mint/30 border-t-navy"
        aria-hidden
      />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}
