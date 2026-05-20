import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './dto/pagination-query.dto';

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  return {
    items,
    page,
    limit,
    total,
    totalPages,
  };
}

export function paginationArgs(page = 1, limit = DEFAULT_PAGE_SIZE) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}
