import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '../constants/pagination';

export { DEFAULT_PAGE_SIZE, MAX_SERVER_PAGE_SIZE } from '../constants/pagination';

export function useClientPagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [totalItems, pageSize]);

  const safePage = Math.min(page, totalPages);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const rangeStart = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalItems);

  return {
    page: safePage,
    setPage,
    totalPages,
    pageSize,
    totalItems,
    pagedItems,
    rangeStart,
    rangeEnd,
    showPagination: totalPages > 1,
  };
}
