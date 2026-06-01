import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { HrEvaluator } from '../../types/evaluator';
import { queryKeys } from '../../hooks/queryKeys';

export function useHrEvaluators() {
  return useQuery({
    queryKey: queryKeys.hrEvaluators.list,
    queryFn: () => api.get<HrEvaluator[]>('/hr/evaluators').then((r) => r.data),
  });
}

export function useHrEvaluatorMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.hrEvaluators.list });
    void qc.invalidateQueries({ queryKey: queryKeys.jobs.evaluatorUsers });
  };

  const create = useMutation({
    mutationFn: (body: { email: string; password: string; name?: string }) =>
      api.post<HrEvaluator>('/hr/evaluators', body).then((r) => r.data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      email?: string;
      name?: string;
      password?: string;
    }) => api.patch<HrEvaluator>(`/hr/evaluators/${id}`, body).then((r) => r.data),
    onSuccess: invalidate,
  });

  const deactivate = useMutation({
    mutationFn: (id: string) =>
      api.post<HrEvaluator>(`/hr/evaluators/${id}/deactivate`).then((r) => r.data),
    onSuccess: invalidate,
  });

  const reactivate = useMutation({
    mutationFn: (id: string) =>
      api.post<HrEvaluator>(`/hr/evaluators/${id}/reactivate`).then((r) => r.data),
    onSuccess: invalidate,
  });

  return { create, update, deactivate, reactivate };
}
