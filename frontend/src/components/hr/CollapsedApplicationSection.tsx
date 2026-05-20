import { Link } from 'react-router-dom';
import type { Application } from '../../types';
import { DEFAULT_PAGE_SIZE, useClientPagination } from '../../hooks/useClientPagination';
import { ApplicationListRow } from './ApplicationListRow';
import { CollapsedSection } from '../ui/CollapsedSection';
import { ListPagination } from '../ui/ListPagination';

export type ServerPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
};

type Props = {
  title: string;
  description?: string;
  applications: Application[];
  defaultOpen?: boolean;
  tone?: 'neutral' | 'muted' | 'danger';
  pageSize?: number;
  /** Total for badge when using server-side pagination. */
  totalCount?: number;
  serverPagination?: ServerPaginationProps;
};

export function CollapsedApplicationSection({
  title,
  description,
  applications,
  defaultOpen = false,
  tone = 'neutral',
  pageSize = DEFAULT_PAGE_SIZE,
  totalCount,
  serverPagination,
}: Props) {
  const clientPage = useClientPagination(
    applications,
    serverPagination ? Math.max(applications.length, 1) : pageSize,
  );

  const items = serverPagination ? applications : clientPage.pagedItems;
  const badgeCount = totalCount ?? applications.length;

  if (badgeCount === 0) {
    return null;
  }

  const pagination = serverPagination ?? {
    page: clientPage.page,
    totalPages: clientPage.totalPages,
    totalItems: clientPage.totalItems,
    rangeStart: clientPage.rangeStart,
    rangeEnd: clientPage.rangeEnd,
    onPageChange: clientPage.setPage,
  };

  return (
    <CollapsedSection
      title={title}
      description={description}
      defaultOpen={defaultOpen}
      tone={tone}
      badge={badgeCount}
    >
      <ul className="space-y-2">
        {items.map((app) => (
          <ApplicationListRow
            key={app.id}
            application={app}
            variant="compact"
            title={app.candidate?.name?.trim() || app.candidate?.email || 'Candidate'}
            subtitle={
              app.candidate?.name && app.candidate?.email ? app.candidate.email : null
            }
            detail={app.job?.title ?? null}
            actions={
              <Link
                className="btn-secondary btn-sm shrink-0 text-center"
                to={`/hr/applications/${app.id}`}
              >
                Open
              </Link>
            }
          />
        ))}
      </ul>
      <ListPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        rangeStart={pagination.rangeStart}
        rangeEnd={pagination.rangeEnd}
        onPageChange={pagination.onPageChange}
      />
    </CollapsedSection>
  );
}
