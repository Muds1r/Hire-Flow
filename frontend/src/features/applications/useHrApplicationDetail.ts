import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Application } from '../../types';
import { queryKeys } from '../../hooks/queryKeys';

export function useHrApplicationDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id),
    queryFn: () =>
      api.get<Application>(`/applications/${id}`).then((r) => r.data),
    enabled: !!id,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data?.aiStatus === 'PENDING' ? 3000 : false,
  });
}
