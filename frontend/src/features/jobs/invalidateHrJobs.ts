import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/queryKeys';

/** Refresh HR job board and paginated published/closed lists. */
export function invalidateHrJobsQueries(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: queryKeys.jobs.hrBoard });
  void qc.invalidateQueries({ queryKey: queryKeys.jobs.hrPublishedPrefix });
  void qc.invalidateQueries({ queryKey: queryKeys.jobs.hrPublishedOptions });
  void qc.invalidateQueries({ queryKey: queryKeys.jobs.hrClosedPrefix });
}
