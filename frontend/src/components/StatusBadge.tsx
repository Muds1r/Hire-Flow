/** Application pipeline statuses */
const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Applied',
  CV_ANALYZED: 'CV analyzed',
  TEST_READY: 'Test ready (draft)',
  TEST_SENT: 'Test sent',
  TEST_STARTED: 'Assessment started',
  TEST_SUBMITTED: 'Test submitted',
  GRADED: 'Graded',
  UNDER_REVIEW: 'Under review',
  INTERVIEW: 'Interview',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

/** Test row statuses (TestStatus enum) — checked first. */
const TEST_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Assessment: draft',
  SENT: 'Assessment: not started',
  IN_PROGRESS: 'Assessment: in progress',
  SUBMITTED: 'Assessment: submitted',
  AUTO_SUBMITTED: 'Assessment: auto-submitted',
  GRADED: 'Assessment: graded',
};

function testStatusTone(status: string): string {
  if (status === 'GRADED') {
    return 'bg-mint-light text-navy ring-mint/40';
  }
  if (status === 'SUBMITTED' || status === 'AUTO_SUBMITTED') {
    return 'bg-mint-light text-navy ring-mint/40';
  }
  if (status === 'IN_PROGRESS') {
    return 'bg-navy/10 text-navy ring-navy/20';
  }
  if (status === 'SENT') {
    return 'bg-mint/15 text-navy ring-mint/30';
  }
  if (status === 'DRAFT') {
    return 'bg-amber-50 text-amber-900 ring-amber-200/80';
  }
  return 'bg-slate-100 text-slate-700 ring-slate-200/80';
}

function applicationStatusToneClass(status: string): string {
  const s = status.toUpperCase();
  if (s === 'HIRED' || s === 'INTERVIEW') {
    return 'bg-mint-light text-navy ring-mint/40';
  }
  if (s.includes('REJECTED')) {
    return 'bg-red-50 text-red-800 ring-red-200/80';
  }
  if (s.includes('TEST') || s.includes('PROGRESS')) {
    return 'bg-navy/10 text-navy ring-navy/20';
  }
  if (s.includes('REVIEW')) {
    return 'bg-mint/20 text-navy ring-mint/50';
  }
  if (s.includes('MATCHED') || s.includes('CV_') || s === 'CV_ANALYZED') {
    return 'bg-mint-light text-navy ring-mint/30';
  }
  return 'bg-slate-100 text-slate-700 ring-slate-200/80';
}

function statusToneClass(status: string): string {
  if (TEST_STATUS_LABELS[status]) {
    return testStatusTone(status);
  }
  return applicationStatusToneClass(status);
}

type StatusBadgeProps = {
  status: string;
  /** When REJECTED because the job was closed (candidate was still in pipeline). */
  rejectionReason?: 'JOB_CLOSED' | 'HR_MANUAL' | null;
};

export function StatusBadge({ status, rejectionReason }: StatusBadgeProps) {
  const isJobClosedReject =
    status.toUpperCase() === 'REJECTED' && rejectionReason === 'JOB_CLOSED';

  const label = isJobClosedReject
    ? 'Job was closed'
    : (TEST_STATUS_LABELS[status] ??
      STATUS_LABELS[status] ??
      status.replace(/_/g, ' '));

  const toneClass = isJobClosedReject
    ? 'bg-slate-100 text-slate-700 ring-slate-200/80'
    : statusToneClass(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${isJobClosedReject ? '' : 'capitalize'} ${toneClass}`}
    >
      {label}
    </span>
  );
}
