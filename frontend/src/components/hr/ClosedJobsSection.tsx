import { useHrClosedJobs } from '../../features/jobs/hooks';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';
import { HrJobListRow } from '../../features/jobs/HrJobListRow';
import { CollapsedSection } from '../ui/CollapsedSection';
import { ListPagination } from '../ui/ListPagination';
import { ErrorCard } from '../ui/ErrorCard';
import { getApiErrorMessage } from '../../services/http';
import {
  useServerPageState,
  useServerPaginationSync,
} from '../../hooks/useServerPageState';

export function ClosedJobsSection() {
  const { page, setPage } = useServerPageState();
  const query = useHrClosedJobs(page, DEFAULT_PAGE_SIZE);
  const data = query.data;
  const { rangeStart, rangeEnd } = useServerPaginationSync(data, page, setPage);

  if (query.isError) {
    return (
      <ErrorCard
        message="Could not load closed jobs."
        detail={getApiErrorMessage(query.error, 'Request failed.')}
      />
    );
  }

  if (!query.isLoading && (data?.total ?? 0) === 0) {
    return null;
  }

  return (
    <CollapsedSection
      title="Closed jobs"
      description="Archived postings. Expand to browse closed roles."
      defaultOpen={false}
      tone="muted"
      badge={data?.total ?? 0}
    >
      {query.isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : data ? (
        <>
          <ul className="space-y-2 text-left text-sm">
            {data.items.map((j) => (
              <HrJobListRow key={j.id} job={j} linkPrefix="/hr/jobs" />
            ))}
          </ul>
          <ListPagination
            page={data.page}
            totalPages={data.totalPages}
            totalItems={data.total}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </CollapsedSection>
  );
}
