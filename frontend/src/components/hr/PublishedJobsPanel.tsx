import type { Job } from '../../types';
import { useHrPublishedJobs } from '../../features/jobs/hooks';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';
import { getApiErrorMessage } from '../../services/http';
import { ErrorCard } from '../ui/ErrorCard';
import { HrJobListRow } from '../../features/jobs/HrJobListRow';
import { ListSkeleton } from '../ui/ListSkeleton';
import { ListPagination } from '../ui/ListPagination';
import {
  useServerPageState,
  useServerPaginationSync,
} from '../../hooks/useServerPageState';

/** Roughly how many job rows stay visible before the list scrolls within a page. */
const VISIBLE_ROWS = 6;

export function PublishedJobsPanel() {
  const { page, setPage } = useServerPageState();
  const query = useHrPublishedJobs(page, DEFAULT_PAGE_SIZE);
  const data = query.data;
  const jobs: Job[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const scrollable = jobs.length > VISIBLE_ROWS;
  const { rangeStart, rangeEnd } = useServerPaginationSync(data, page, setPage);

  return (
    <div className="app-card flex min-h-0 flex-col">
      <div className="shrink-0">
        <h2 className="text-lg font-bold text-slate-900">Published jobs</h2>
        <p className="mt-1 text-sm text-slate-600">
          Live for candidates; bank prep runs on publish.
          {total > 0 && (
            <span className="ml-1 font-medium text-navy">({total})</span>
          )}
        </p>
      </div>
      {query.isError ? (
        <div className="mt-4">
          <ErrorCard
            message="Could not load published jobs."
            detail={getApiErrorMessage(query.error, 'Request failed.')}
          />
        </div>
      ) : query.isLoading ? (
        <ListSkeleton rows={4} className="mt-4" />
      ) : (
        <>
          <ul
            className={[
              'mt-4 space-y-2 text-left text-sm',
              scrollable
                ? 'max-h-[26.5rem] overflow-y-auto overscroll-y-contain pr-1 [scrollbar-gutter:stable]'
                : '',
            ].join(' ')}
            aria-label="Published jobs"
          >
            {jobs.map((j) => (
              <HrJobListRow key={j.id} job={j} linkPrefix="/jobs" />
            ))}
            {!query.isError && jobs.length === 0 && (
              <li className="text-slate-500">No published jobs yet.</li>
            )}
          </ul>
          {scrollable && jobs.length < total && (
            <p className="mt-2 shrink-0 text-xs text-slate-500">
              Scroll for more on this page
            </p>
          )}
          {data && data.totalPages > 1 && (
            <ListPagination
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
