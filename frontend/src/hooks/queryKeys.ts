/** Central React Query keys — avoids typos and eases invalidation. */
export const queryKeys = {
  jobs: {
    listOpen: ['jobs'] as const,
    hrBoard: ['jobs', 'hr-board'] as const,
    hrPublishedPrefix: ['jobs', 'hr-published'] as const,
    hrClosedPrefix: ['jobs', 'hr-closed'] as const,
    hrPublished: (page: number, limit: number) =>
      ['jobs', 'hr-published', page, limit] as const,
    hrPublishedOptions: ['jobs', 'hr-published-options'] as const,
    hrClosed: (page: number, limit: number) => ['jobs', 'hr-closed', page, limit] as const,
    evaluatorUsers: ['jobs', 'evaluator-users'] as const,
    evaluatorPending: ['jobs', 'evaluator-pending'] as const,
    evaluatorDraft: (id: string | undefined) => ['jobs', 'evaluator-draft', id] as const,
    detail: (id: string | undefined) => ['job', id] as const,
  },
  hrEvaluators: {
    list: ['hr-evaluators'] as const,
  },
  applications: {
    list: ['applications'] as const,
    hrRejectedPrefix: ['applications', 'hr-rejected'] as const,
    hrPipelinePrefix: ['applications', 'hr-pipeline'] as const,
    hrByJobPrefix: ['applications', 'hr-by-job'] as const,
    hrRejected: (page: number, limit: number) =>
      ['applications', 'hr-rejected', page, limit] as const,
    hrPipeline: (jobId: string | undefined) =>
      ['applications', 'hr-pipeline', jobId] as const,
    hrByJob: (jobId: string | undefined) => ['applications', 'hr-by-job', jobId] as const,
    detail: (id: string | undefined) => ['application', id] as const,
    evaluatorPosts: (applicationId: string | undefined) =>
      ['evaluator-posts', applicationId] as const,
  },
  tests: {
    candidate: (testId: string | undefined) => ['test-candidate', testId] as const,
    resultView: (testId: string | undefined) => ['test-hr', testId] as const,
  },
} as const;
