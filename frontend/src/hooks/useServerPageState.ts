import { useEffect, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '../constants/pagination';
import { paginatedRange } from '../utils/paginatedRange';

type PaginatedMeta = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
};

/** Local page state + clamp when server total shrinks + range for ListPagination. */
export function useServerPageState(limit = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  return { page, setPage, limit };
}

export function useServerPaginationSync(
  data: PaginatedMeta | undefined,
  page: number,
  setPage: (next: number) => void,
  limit = DEFAULT_PAGE_SIZE,
) {
  useEffect(() => {
    if (data && page > data.totalPages) {
      setPage(Math.max(1, data.totalPages));
    }
  }, [data, page, setPage]);

  return paginatedRange(data?.page ?? page, data?.limit ?? limit, data?.total ?? 0);
}
