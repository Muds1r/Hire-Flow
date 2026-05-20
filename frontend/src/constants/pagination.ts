/** Default page size for paginated HR lists. */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Max `limit` allowed by the API (`PaginationQueryDto`).
 * Keep in sync with `backend/src/common/dto/pagination-query.dto.ts` → `MAX_PAGE_SIZE`.
 */
export const MAX_SERVER_PAGE_SIZE = 50;
