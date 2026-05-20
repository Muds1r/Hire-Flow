import type { ApplicationRejectionReason } from '../types';

type RejectionContext = {
  status: string;
  rejectionReason?: ApplicationRejectionReason | null;
  updatedAt?: string | null;
  job?: { closedAt?: string | null } | null;
};

/** Same window as close-job transaction (reject + close land together). */
const JOB_CLOSE_REJECT_MS = 3 * 60 * 1000;

/**
 * Label reason for REJECTED rows: explicit DB value, or infer job-close when
 * rejection happened at the same time the job was closed (legacy rows).
 */
export function resolveRejectionReason(
  app: RejectionContext,
): ApplicationRejectionReason | null | undefined {
  if (app.rejectionReason === 'JOB_CLOSED' || app.rejectionReason === 'HR_MANUAL') {
    return app.rejectionReason;
  }
  if (app.status.toUpperCase() !== 'REJECTED') {
    return app.rejectionReason;
  }
  const closedAt = app.job?.closedAt;
  if (!closedAt || !app.updatedAt) {
    return null;
  }
  const closedMs = new Date(closedAt).getTime();
  const updatedMs = new Date(app.updatedAt).getTime();
  if (
    !Number.isNaN(closedMs) &&
    !Number.isNaN(updatedMs) &&
    Math.abs(updatedMs - closedMs) <= JOB_CLOSE_REJECT_MS
  ) {
    return 'JOB_CLOSED';
  }
  return null;
}
