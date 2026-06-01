import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { queryKeys } from '../../hooks/queryKeys';
import { invalidateHrApplicationCaches } from './hooks';

type Options = {
  applicationId: string | undefined;
  jobId: string | undefined;
  testId: string | undefined;
  onGenerateSuccess?: () => void;
  onAssignSuccess?: () => void;
};

export function useHrApplicationMutations({
  applicationId,
  jobId,
  testId,
  onGenerateSuccess,
  onAssignSuccess,
}: Options) {
  const qc = useQueryClient();

  const refreshApplication = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.applications.detail(applicationId) });
    invalidateHrApplicationCaches(qc, jobId);
  };

  const assign = useMutation({
    mutationFn: (evaluatorIds: string[]) =>
      api.post(`/applications/${applicationId}/evaluators`, { evaluatorIds }),
    onSuccess: () => {
      onAssignSuccess?.();
      refreshApplication();
    },
  });

  const generateTest = useMutation({
    mutationFn: () => api.post(`/applications/${applicationId}/tests/generate`),
    onSuccess: () => {
      onGenerateSuccess?.();
      refreshApplication();
    },
  });

  const sendTest = useMutation({
    mutationFn: () => {
      if (!testId) {
        return Promise.reject(new Error('No test'));
      }
      return api.post(`/tests/${testId}/hr/send`);
    },
    onSuccess: refreshApplication,
  });

  const sendToEvaluators = useMutation({
    mutationFn: () => {
      if (!applicationId) {
        return Promise.reject(new Error('No application'));
      }
      return api.post(`/applications/${applicationId}/send-to-evaluators`);
    },
    onSuccess: () => {
      refreshApplication();
      void qc.invalidateQueries({
        queryKey: queryKeys.applications.evaluatorPosts(applicationId),
      });
    },
  });

  const hrReject = useMutation({
    mutationFn: () => api.post(`/applications/${applicationId}/hr-reject`),
    onSuccess: refreshApplication,
  });

  const hrMoveInterview = useMutation({
    mutationFn: () => api.post(`/applications/${applicationId}/hr-move-to-interview`),
    onSuccess: refreshApplication,
  });

  const retryCvAi = useMutation({
    mutationFn: () => api.post(`/applications/${applicationId}/retry-cv-ai`),
    onSuccess: refreshApplication,
  });

  return {
    assign,
    generateTest,
    sendTest,
    sendToEvaluators,
    hrReject,
    hrMoveInterview,
    retryCvAi,
  };
}
