import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/http';
import type { HrJobsBoard, Job, Paginated } from '../../types';
import { queryKeys } from '../../hooks/queryKeys';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';

export type EvaluatorUser = {
  id: string;
  email: string;
  name?: string | null;
};

export function useOpenJobs() {
  return useQuery({
    queryKey: queryKeys.jobs.listOpen,
    queryFn: () => api.get<Job[]>('/jobs').then((r) => r.data),
  });
}

export function useHrBoard() {
  return useQuery({
    queryKey: queryKeys.jobs.hrBoard,
    queryFn: () => api.get<HrJobsBoard>('/jobs/my/board').then((r) => r.data),
    refetchInterval: (query) =>
      query.state.data?.bankPrepInProgress ? 4000 : false,
  });
}

export function useHrPublishedJobs(page: number, limit = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: queryKeys.jobs.hrPublished(page, limit),
    queryFn: () =>
      api
        .get<Paginated<Job>>('/jobs/my/published', { params: { page, limit } })
        .then((r) => r.data),
  });
}

/** All open published jobs for pipeline job picker (up to 200 on server). */
export function useHrPublishedJobOptions() {
  return useQuery({
    queryKey: queryKeys.jobs.hrPublishedOptions,
    queryFn: () => api.get<Job[]>('/jobs/my/published/options').then((r) => r.data),
  });
}

export function useHrClosedJobs(page: number, limit = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: queryKeys.jobs.hrClosed(page, limit),
    queryFn: () =>
      api
        .get<Paginated<Job>>('/jobs/my/closed', { params: { page, limit } })
        .then((r) => r.data),
  });
}

export function useEvaluatorUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.jobs.evaluatorUsers,
    queryFn: () =>
      api.get<EvaluatorUser[]>('/jobs/meta/evaluator-users').then((r) => r.data),
    enabled,
  });
}

export function useEvaluatorPendingJobs() {
  return useQuery({
    queryKey: queryKeys.jobs.evaluatorPending,
    queryFn: () => api.get<Job[]>('/jobs/evaluator/pending').then((r) => r.data),
  });
}

export function useEvaluatorDraftJob(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.jobs.evaluatorDraft(jobId),
    queryFn: () => api.get<Job>(`/jobs/evaluator/${jobId}`).then((r) => r.data),
    enabled: !!jobId,
  });
}

export function useJobDetail(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(jobId),
    queryFn: () => api.get<Job>(`/jobs/${jobId}`).then((r) => r.data),
    enabled: !!jobId,
  });
}
