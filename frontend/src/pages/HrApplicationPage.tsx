import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { getApiErrorMessage } from '../utils/apiError';
import { QueryPanel } from '../components/ui/QueryPanel';
import { CollapsedSection } from '../components/ui/CollapsedSection';
import { CvMatchSummary } from '../components/hr/CvMatchSummary';
import { HrApplicationHeader } from '../components/hr/HrApplicationHeader';
import { HrApplicationEvaluatorsCard } from '../components/hr/HrApplicationEvaluatorsCard';
import { HrApplicationUnderReviewCard } from '../components/hr/HrApplicationUnderReviewCard';
import { SectionResultsPanel } from '../components/assessment/SectionResultsPanel';
import { getApplicationActions, type ApplicationActionsResult } from '../utils/applicationActions';
import { bankPrepWaitMessage } from '../utils/bankPrepPhase';
import { useEvaluatorUsers } from '../features/jobs/hooks';
import { useApplicationReview } from '../features/applications/useApplicationReview';
import { useHrApplicationDetail } from '../features/applications/useHrApplicationDetail';
import { useHrApplicationMutations } from '../features/applications/useHrApplicationMutations';

export function HrApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const appQuery = useHrApplicationDetail(id);
  const appData = appQuery.data;
  const testFromQuery = appData?.tests?.[0];
  const testId = testFromQuery?.id;

  const [testGeneratedNotice, setTestGeneratedNotice] = useState(false);
  const [assignPick, setAssignPick] = useState<string[]>([]);

  const mutations = useHrApplicationMutations({
    applicationId: id,
    jobId: appData?.jobId,
    testId,
    onGenerateSuccess: () => setTestGeneratedNotice(true),
    onAssignSuccess: () => setAssignPick([]),
  });

  const evalUsersQuery = useEvaluatorUsers(!!id && !!appData);

  const actions: ApplicationActionsResult = useMemo(() => {
    if (!appData) {
      return {
        generateTestVisible: false,
        sendTestVisible: false,
        sendTestDisabled: false,
        sendToEvaluatorsVisible: false,
        showResultVisible: false,
        rejectVisible: false,
        assignEvaluatorsHintVisible: false,
        evaluatorAssignmentControlsVisible: false,
      };
    }
    const lt = appData.tests?.[0];
    return getApplicationActions(
      {
        status: appData.status,
        sentToEvaluatorsAt: appData.sentToEvaluatorsAt,
        evaluatorAssignmentCount: appData.evaluatorAssignments?.length ?? 0,
      },
      lt
        ? {
            status: lt.status,
            testSections: lt.testSections,
          }
        : undefined,
    );
  }, [appData]);

  const review = useApplicationReview({
    applicationId: id,
    testId,
    fetchTestResult: !!testId && actions.showResultVisible,
  });

  const sectionOrder = useMemo(() => {
    const job = appData?.job;
    const config = job?.assessmentSectionConfig;
    if (config?.length) {
      return config.map((c) => c.title);
    }
    return job?.assessmentSectionTitles ?? undefined;
  }, [appData?.job]);

  const assignableEvaluators = useMemo(() => {
    const app = appData;
    if (!app || !evalUsersQuery.data) return [];
    const taken = new Set(
      (app.evaluatorAssignments ?? []).map((a) => a.evaluator.id),
    );
    return evalUsersQuery.data.filter((u) => !taken.has(u.id));
  }, [appData, evalUsersQuery.data]);

  const handleHrReject = () => {
    if (
      !window.confirm(
        'Reject this candidate for this job? Their application will be marked as rejected.',
      )
    ) {
      return;
    }
    mutations.hrReject.mutate();
  };

  const handleHrMoveInterview = () => {
    if (
      !window.confirm(
        'Move this candidate to the Interview phase? You can still reject later.',
      )
    ) {
      return;
    }
    mutations.hrMoveInterview.mutate();
  };

  return (
    <QueryPanel
      isLoading={appQuery.isLoading}
      isError={!!appQuery.error}
      loadingMessage="Loading application…"
      errorMessage="Could not load application."
      errorDetail={
        appQuery.error
          ? getApiErrorMessage(appQuery.error, 'Request failed.')
          : undefined
      }
      backTo="/hr/pipeline"
      backLabel="← Pipeline"
    >
      {!appData ? (
        <div className="app-card text-red-800">
          <p className="font-medium">Application not found.</p>
          <Link className="link-muted mt-3 inline-block" to="/hr/pipeline">
            ← Pipeline
          </Link>
        </div>
      ) : (
        <HrApplicationBody
          app={appData}
          actions={actions}
          review={review}
          sectionOrder={sectionOrder}
          assignableEvaluators={assignableEvaluators}
          evalUsersLoading={evalUsersQuery.isLoading}
          evaluatorDirectoryEmpty={(evalUsersQuery.data?.length ?? 0) === 0}
          assignPick={assignPick}
          setAssignPick={setAssignPick}
          testGeneratedNotice={testGeneratedNotice}
          setTestGeneratedNotice={setTestGeneratedNotice}
          mutations={mutations}
          onHrReject={handleHrReject}
          onHrMoveInterview={handleHrMoveInterview}
        />
      )}
    </QueryPanel>
  );
}

type BodyProps = {
  app: NonNullable<ReturnType<typeof useHrApplicationDetail>['data']>;
  actions: ApplicationActionsResult;
  review: ReturnType<typeof useApplicationReview>;
  sectionOrder: string[] | undefined;
  assignableEvaluators: { id: string; email: string; name?: string | null }[];
  evalUsersLoading: boolean;
  evaluatorDirectoryEmpty: boolean;
  assignPick: string[];
  setAssignPick: (ids: string[]) => void;
  testGeneratedNotice: boolean;
  setTestGeneratedNotice: (v: boolean) => void;
  mutations: ReturnType<typeof useHrApplicationMutations>;
  onHrReject: () => void;
  onHrMoveInterview: () => void;
};

function HrApplicationBody({
  app,
  actions,
  review,
  sectionOrder,
  assignableEvaluators,
  evalUsersLoading,
  evaluatorDirectoryEmpty,
  assignPick,
  setAssignPick,
  testGeneratedNotice,
  setTestGeneratedNotice,
  mutations,
  onHrReject,
  onHrMoveInterview,
}: BodyProps) {
  const latestTest = app.tests?.[0];
  const hasDraftTest = latestTest?.status === 'DRAFT';
  const bankReady = app.job?.assessmentBankReady === true;
  const draftReadyToSend =
    hasDraftTest && actions.sendTestVisible && !actions.sendTestDisabled;

  return (
    <div className="text-left">
      <HrApplicationHeader
        app={app}
        actions={actions}
        bankReady={bankReady}
        hasDraftTest={hasDraftTest}
        genTestPending={mutations.generateTest.isPending}
        sendTestPending={mutations.sendTest.isPending}
        hrRejectPending={mutations.hrReject.isPending}
        retryCvAiPending={mutations.retryCvAi.isPending}
        onRetryCvAi={
          app.aiStatus === 'FAILED' ? () => mutations.retryCvAi.mutate() : undefined
        }
        onGenerateTest={() => {
          setTestGeneratedNotice(false);
          mutations.generateTest.mutate();
        }}
        onSendTest={() => mutations.sendTest.mutate()}
        onReject={() => {
          if (
            !window.confirm(
              'Reject this candidate for this job? Their application will be marked as rejected.',
            )
          ) {
            return;
          }
          mutations.hrReject.mutate();
        }}
      />

      {(actions.generateTestVisible || actions.sendTestVisible) && (
        <p className="mt-4 text-sm text-slate-600">
          Use <strong>Generate test</strong> to build this candidate&apos;s unique assessment from the job
          question bank (same topics and difficulty mix as other applicants, different questions). When
          the test is ready, <strong>Send to candidate</strong> makes it available in their portal. After
          they finish and results are graded, assign evaluators and <strong>Send to evaluators</strong>{' '}
          below.
        </p>
      )}

      {mutations.generateTest.isPending && (
        <p className="mt-4 text-sm font-medium text-navy" role="status">
          Generating unique test from the question bank…
        </p>
      )}

      {(testGeneratedNotice || draftReadyToSend) &&
        !mutations.generateTest.isPending &&
        draftReadyToSend && (
          <p
            className="mt-4 rounded-lg bg-mint-light px-4 py-3 text-sm font-medium text-navy ring-1 ring-mint/40/80"
            role="status"
          >
            Unique test is ready. You can send it to the candidate.
          </p>
        )}

      {actions.generateTestVisible && !bankReady && !mutations.generateTest.isPending && (
        <p className="mt-4 text-sm font-medium text-amber-900">
          {bankPrepWaitMessage(app.job)}
        </p>
      )}

      {actions.sendTestVisible && actions.sendTestDisabled && !mutations.generateTest.isPending && (
        <p className="mt-4 text-sm font-medium text-amber-900">
          Test exists but is incomplete (each section needs 10 questions). Try{' '}
          <strong>Regenerate test</strong>.
        </p>
      )}

      <CollapsedSection
        className="mt-8"
        title="JD vs CV match"
        description="AI comparison of the job description and candidate resume."
        defaultOpen
      >
        {app.aiStatus === 'PENDING' && (
          <div className="space-y-2">
            <p className="text-sm text-amber-900" role="status">
              Analysis in progress — this page updates automatically every few seconds.
            </p>
            {mutations.retryCvAi.isPending && (
              <p className="text-xs text-slate-600">Starting analysis…</p>
            )}
          </div>
        )}
        {app.aiStatus === 'FAILED' && (
          <div className="space-y-3">
            <p className="text-sm text-red-800">
              Automatic CV parsing or JD matching did not complete. This is often caused by a
              missing or invalid <code className="text-xs">OPENAI_API_KEY</code> on the server, a
              timeout, or unreadable CV text. You can still generate tests when the question bank
              is ready.
            </p>
            {mutations.retryCvAi.isError && (
              <p className="text-sm font-medium text-red-700" role="alert">
                {getApiErrorMessage(
                  mutations.retryCvAi.error,
                  'Could not restart CV/JD analysis.',
                )}
              </p>
            )}
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={mutations.retryCvAi.isPending}
              onClick={() => mutations.retryCvAi.mutate()}
            >
              {mutations.retryCvAi.isPending ? 'Retrying…' : 'Retry CV / JD analysis'}
            </button>
          </div>
        )}
        {app.aiStatus === 'COMPLETED' && app.matchResult != null && (
          <CvMatchSummary matchResult={app.matchResult} />
        )}
        {app.aiStatus !== 'PENDING' &&
          app.aiStatus !== 'FAILED' &&
          (app.aiStatus !== 'COMPLETED' || app.matchResult == null) && (
            <div className="empty-state">
              <p className="font-medium text-slate-600">No match analysis yet</p>
              <p className="mt-1 text-xs">
                Available after the candidate applies and CV processing completes.
              </p>
            </div>
          )}
      </CollapsedSection>

      <HrApplicationEvaluatorsCard
        app={app}
        actions={actions}
        evalUsersLoading={evalUsersLoading}
        assignableEvaluators={assignableEvaluators}
        assignPick={assignPick}
        onAssignPickChange={setAssignPick}
        sendEvalPending={mutations.sendToEvaluators.isPending}
        assignPending={mutations.assign.isPending}
        sendEvalError={mutations.sendToEvaluators.error}
        assignError={mutations.assign.error}
        onSendToEvaluators={() => mutations.sendToEvaluators.mutate()}
        onAssign={() => mutations.assign.mutate(assignPick)}
        evaluatorDirectoryEmpty={evaluatorDirectoryEmpty}
      />

      <CollapsedSection
        className="mt-8"
        title="Section results & notes"
        description="Evaluator follow-ups appear beside each section. Scores show when the test is graded."
        badge={(() => {
          if (review.posts.length > 0) {
            return review.posts.length;
          }
          const sectionCount =
            review.testResultQuery.data?.sections?.length ?? sectionOrder?.length ?? 0;
          return sectionCount > 0 ? sectionCount : undefined;
        })()}
      >
        {review.postsQuery.isLoading && (
          <p className="text-sm text-slate-500">Loading…</p>
        )}
        {review.postsQuery.isError && (
          <p className="text-sm font-medium text-red-800" role="alert">
            {getApiErrorMessage(review.postsQuery.error, 'Could not load section notes.')}
          </p>
        )}
        {!review.postsQuery.isLoading && !review.postsQuery.isError && (
          <>
            {review.testResultQuery.data?.result ||
            review.posts.length > 0 ||
            (sectionOrder?.length ?? 0) > 0 ? (
              <SectionResultsPanel
                data={
                  review.testResultQuery.data?.result ? review.testResultQuery.data : undefined
                }
                sectionOrder={sectionOrder}
                notes={{
                  posts: review.posts,
                  readOnly: true,
                  canAddNotes: false,
                }}
              />
            ) : (
              <div className="empty-state">
                <p className="font-medium text-slate-600">No section results yet</p>
                <p className="mt-1 text-xs">
                  Scores and evaluator notes appear after the test is generated and graded.
                </p>
              </div>
            )}
          </>
        )}
      </CollapsedSection>

      {app.status === 'UNDER_REVIEW' && (
        <HrApplicationUnderReviewCard
          app={app}
          rejectPending={mutations.hrReject.isPending}
          interviewPending={mutations.hrMoveInterview.isPending}
          onReject={onHrReject}
          onMoveToInterview={onHrMoveInterview}
        />
      )}

      {mutations.generateTest.isError && (
        <p
          className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-200/80"
          role="alert"
        >
          {getApiErrorMessage(
            mutations.generateTest.error,
            'Generation failed — check OpenAI key, quotas, or network timeout.',
          )}
        </p>
      )}
      {mutations.sendTest.isError && (
        <p
          className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-200/80"
          role="alert"
        >
          {getApiErrorMessage(mutations.sendTest.error, 'Could not send assessment.')}
        </p>
      )}
      {mutations.hrReject.isError && (
        <p
          className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-200/80"
          role="alert"
        >
          {getApiErrorMessage(mutations.hrReject.error, 'Could not reject application.')}
        </p>
      )}
      {mutations.hrMoveInterview.isError && (
        <p
          className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ring-1 ring-red-200/80"
          role="alert"
        >
          {getApiErrorMessage(mutations.hrMoveInterview.error, 'Could not move to interview.')}
        </p>
      )}
    </div>
  );
}
