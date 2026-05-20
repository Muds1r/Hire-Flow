import { CollapsedApplicationSection } from './CollapsedApplicationSection';
import { CollapsedSection } from '../ui/CollapsedSection';
import { ErrorCard } from '../ui/ErrorCard';
import { useHrRejectedApplications } from '../../features/applications/hooks';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';
import { getApiErrorMessage } from '../../services/http';
import {
  useServerPageState,
  useServerPaginationSync,
} from '../../hooks/useServerPageState';

export function RejectedCandidatesSection() {
  const { page, setPage } = useServerPageState();
  const query = useHrRejectedApplications(page, DEFAULT_PAGE_SIZE);
  const data = query.data;
  const { rangeStart, rangeEnd } = useServerPaginationSync(data, page, setPage);

  if (query.isError) {
    return (
      <ErrorCard
        message="Could not load rejected candidates."
        detail={getApiErrorMessage(query.error, 'Request failed.')}
      />
    );
  }

  if (!query.isLoading && (data?.total ?? 0) === 0) {
    return null;
  }

  if (query.isLoading && !data) {
    return (
      <CollapsedSection
        title="Rejected candidates"
        description="Manual rejections and candidates auto-rejected when a job was closed."
        tone="danger"
      >
        <p className="text-sm text-slate-500">Loading…</p>
      </CollapsedSection>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <CollapsedApplicationSection
      title="Rejected candidates"
      description="Manual rejections and candidates auto-rejected when a job was closed (Hired and Interview selections are kept)."
      applications={data.items}
      tone="danger"
      totalCount={data.total}
      serverPagination={{
        page: data.page,
        totalPages: data.totalPages,
        totalItems: data.total,
        rangeStart,
        rangeEnd,
        onPageChange: setPage,
      }}
    />
  );
}
