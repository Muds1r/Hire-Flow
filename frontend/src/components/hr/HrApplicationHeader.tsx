import { Link } from 'react-router-dom';
import type { Application } from '../../types';
import type { ApplicationActionsResult } from '../../utils/applicationActions';
import { StatusBadge } from '../StatusBadge';
import { BankPrepBadge } from '../BankPrepBadge';
import { CvViewButton } from './CvViewButton';

type Props = {
  app: Application;
  actions: ApplicationActionsResult;
  bankReady: boolean;
  hasDraftTest: boolean;
  genTestPending: boolean;
  sendTestPending: boolean;
  hrRejectPending: boolean;
  retryCvAiPending?: boolean;
  onGenerateTest: () => void;
  onSendTest: () => void;
  onReject: () => void;
  onRetryCvAi?: () => void;
};

export function HrApplicationHeader({
  app,
  actions,
  bankReady,
  hasDraftTest,
  genTestPending,
  sendTestPending,
  hrRejectPending,
  retryCvAiPending = false,
  onGenerateTest,
  onSendTest,
  onReject,
  onRetryCvAi,
}: Props) {
  const latestTest = app.tests?.[0];

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {app.candidate?.email}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {app.candidate?.name ?? 'Candidate'}
          {app.job?.title ? (
            <>
              <span className="text-slate-400"> · </span>
              {app.job.title}
            </>
          ) : null}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={app.status} />
          {app.aiStatus && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              CV / JD AI: {app.aiStatus}
            </span>
          )}
          {latestTest && (
            <span className="inline-flex align-middle">
              <StatusBadge status={latestTest.status} />
            </span>
          )}
          {app.job && !bankReady && !latestTest && (
            <span className="inline-flex align-middle rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
              <BankPrepBadge job={app.job} />
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {app.aiStatus === 'FAILED' && onRetryCvAi && (
          <button
            type="button"
            className="btn-secondary"
            disabled={retryCvAiPending}
            onClick={onRetryCvAi}
          >
            {retryCvAiPending ? 'Retrying CV/JD…' : 'Retry CV / JD analysis'}
          </button>
        )}
        {actions.generateTestVisible && (
          <button
            type="button"
            disabled={genTestPending || !bankReady}
            title={
              !bankReady
                ? 'Wait until the job question bank finishes preparing'
                : undefined
            }
            onClick={onGenerateTest}
            className="btn-primary"
          >
            {genTestPending
              ? 'Generating unique test…'
              : hasDraftTest
                ? 'Regenerate test'
                : 'Generate test'}
          </button>
        )}
        {actions.sendTestVisible && latestTest && (
          <button
            type="button"
            disabled={sendTestPending || actions.sendTestDisabled}
            title={
              actions.sendTestDisabled && !sendTestPending
                ? 'Test is still being generated or incomplete'
                : undefined
            }
            onClick={onSendTest}
            className="btn-success"
          >
            {sendTestPending ? 'Sending…' : 'Send to candidate'}
          </button>
        )}
        {actions.showResultVisible && latestTest && (
          <Link className="btn-secondary" to={`/hr/tests/${latestTest.id}`}>
            View result
          </Link>
        )}
        {app.cvFileKey && <CvViewButton applicationId={app.id} />}
        {actions.rejectVisible && app.status !== 'UNDER_REVIEW' && (
          <button
            type="button"
            className="btn-danger"
            disabled={hrRejectPending}
            onClick={onReject}
          >
            {hrRejectPending ? 'Rejecting…' : 'Reject candidate'}
          </button>
        )}
      </div>
    </header>
  );
}
