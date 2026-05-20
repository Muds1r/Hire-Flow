import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/http';
import { queryKeys } from '../../hooks/queryKeys';
import type { EvaluatorPost, TestResultPayload } from '../../types';

export type UseApplicationReviewOptions = {
  applicationId?: string;
  testId?: string;
  /** Load graded test payload from `/tests/:id/hr`. */
  fetchTestResult?: boolean;
  /** Enable create/update/delete for section notes. */
  allowNoteEdits?: boolean;
  /** Enable evaluator pass / not-pass recommendation form. */
  allowEvaluatorReview?: boolean;
};

export function useApplicationReview({
  applicationId,
  testId,
  fetchTestResult = false,
  allowNoteEdits = false,
  allowEvaluatorReview = false,
}: UseApplicationReviewOptions) {
  const qc = useQueryClient();

  const testResultQuery = useQuery({
    queryKey: queryKeys.tests.resultView(testId),
    queryFn: () =>
      api.get<TestResultPayload>(`/tests/${testId}/hr`).then((r) => r.data),
    enabled: fetchTestResult && !!testId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const resolvedApplicationId =
    applicationId ?? testResultQuery.data?.application.id;

  const postsQuery = useQuery({
    queryKey: queryKeys.applications.evaluatorPosts(resolvedApplicationId),
    queryFn: () =>
      api
        .get<EvaluatorPost[]>(`/applications/${resolvedApplicationId}/evaluator-posts`)
        .then((r) => r.data),
    enabled: !!resolvedApplicationId,
  });

  const createPostMut = useMutation({
    mutationFn: (vars: { sectionTitle: string; comment: string }) =>
      api.post(`/applications/${resolvedApplicationId}/evaluator-posts`, vars),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.applications.evaluatorPosts(resolvedApplicationId),
      });
    },
  });

  const updatePostMut = useMutation({
    mutationFn: (vars: { postId: string; comment: string }) =>
      api.patch(`/evaluator-posts/${vars.postId}`, { comment: vars.comment }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.applications.evaluatorPosts(resolvedApplicationId),
      });
    },
  });

  const deletePostMut = useMutation({
    mutationFn: (postId: string) => api.delete(`/evaluator-posts/${postId}`),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.applications.evaluatorPosts(resolvedApplicationId),
      });
    },
  });

  const [passChoice, setPassChoice] = useState<boolean | null>(null);
  const [summaryDraft, setSummaryDraft] = useState('');

  useEffect(() => {
    if (!allowEvaluatorReview) {
      return;
    }
    const m = testResultQuery.data?.myEvaluatorReview;
    if (m == null) {
      return;
    }
    setPassChoice(m.passForNextPhase);
    setSummaryDraft(m.reviewSummary ?? '');
  }, [
    allowEvaluatorReview,
    testResultQuery.data?.application.id,
    testResultQuery.data?.myEvaluatorReview?.reviewSubmittedAt,
  ]);

  const submitReviewMut = useMutation({
    mutationFn: (vars: {
      applicationId: string;
      passForNextPhase: boolean;
      summary: string;
    }) =>
      api.post(`/applications/${vars.applicationId}/evaluator-review`, {
        passForNextPhase: vars.passForNextPhase,
        summary: vars.summary || undefined,
      }),
    onSuccess: () => {
      testResultQuery.refetch();
      qc.invalidateQueries({ queryKey: queryKeys.applications.list });
    },
  });

  const posts = postsQuery.data ?? [];
  const canMutateNotes = allowNoteEdits && !!resolvedApplicationId;

  return {
    testResultQuery,
    postsQuery,
    posts,
    resolvedApplicationId,
    notes: {
      posts,
      isLoading: postsQuery.isLoading,
      isError: postsQuery.isError,
      error: postsQuery.error,
      canAddNotes: canMutateNotes,
      isCreating: createPostMut.isPending,
      isUpdating: updatePostMut.isPending,
      createError: createPostMut.error,
      onCreate: canMutateNotes
        ? async (sectionTitle: string, comment: string) => {
            await createPostMut.mutateAsync({ sectionTitle, comment });
          }
        : undefined,
      onUpdate: canMutateNotes
        ? async (postId: string, comment: string) => {
            await updatePostMut.mutateAsync({ postId, comment });
          }
        : undefined,
      onDelete: canMutateNotes
        ? async (postId: string) => {
            await deletePostMut.mutateAsync(postId);
          }
        : undefined,
    },
    evaluatorReview: allowEvaluatorReview
      ? {
          passChoice,
          setPassChoice,
          summaryDraft,
          setSummaryDraft,
          submitReviewMut,
          myReview: testResultQuery.data?.myEvaluatorReview,
        }
      : undefined,
  };
}
