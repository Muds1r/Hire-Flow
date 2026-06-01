import { useQuery, type QueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Application, Paginated } from '../../types';
import { queryKeys } from '../../hooks/queryKeys';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';

export function useApplicationsList(options?: { refetchOnMount?: boolean }) {
  return useQuery({
    queryKey: queryKeys.applications.list,
    queryFn: () => api.get<Application[]>('/applications').then((r) => r.data),
    refetchOnMount: options?.refetchOnMount,
    refetchOnWindowFocus: options?.refetchOnMount,
  });
}

export function useHrRejectedApplications(page: number, limit = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: queryKeys.applications.hrRejected(page, limit),
    queryFn: () =>
      api
        .get<Paginated<Application>>('/applications/hr/rejected', {
          params: { page, limit },
        })
        .then((r) => r.data),
  });
}

export function useHrPipelineApplications(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.hrPipeline(jobId),
    queryFn: () =>
      api
        .get<Application[]>('/applications/hr/pipeline', { params: { jobId } })
        .then((r) => r.data),
    enabled: !!jobId,
  });
}

export function useHrApplicationsByJob(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.hrByJob(jobId),
    queryFn: () =>
      api.get<Application[]>(`/applications/hr/by-job/${jobId}`).then((r) => r.data),
    enabled: !!jobId,
  });
}

export function invalidateHrRejectedQueries(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: queryKeys.applications.hrRejectedPrefix });
}

export function invalidateHrPipelineQueries(qc: QueryClient, jobId?: string) {
  void qc.invalidateQueries({ queryKey: queryKeys.applications.hrPipelinePrefix });
  if (jobId) {
    void qc.invalidateQueries({ queryKey: queryKeys.applications.hrPipeline(jobId) });
  }
  void qc.invalidateQueries({ queryKey: queryKeys.applications.hrByJobPrefix });
}

export function invalidateHrApplicationCaches(qc: QueryClient, jobId?: string) {
  void qc.invalidateQueries({ queryKey: queryKeys.applications.list });
  invalidateHrRejectedQueries(qc);
  invalidateHrPipelineQueries(qc, jobId);
}
