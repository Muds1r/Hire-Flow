type Props = {
  rows?: number;
  className?: string;
};

export function ListSkeleton({ rows = 3, className = 'mt-4' }: Props) {
  return (
    <ul className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-3">
          <div className="skeleton-line h-4 w-2/3 max-w-[14rem]" />
          <div className="skeleton-line mt-2 h-3 w-full max-w-lg" />
        </li>
      ))}
    </ul>
  );
}
