export function paginatedRange(page: number, limit: number, total: number) {
  if (total === 0) {
    return { rangeStart: 0, rangeEnd: 0 };
  }
  return {
    rangeStart: (page - 1) * limit + 1,
    rangeEnd: Math.min(page * limit, total),
  };
}
