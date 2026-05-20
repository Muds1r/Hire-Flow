/** Test is still in progress (candidate may leave → should auto-submit). */
export function isTestAttemptInProgress(status: string | undefined): boolean {
  if (!status) return false;
  return status === 'SENT' || status === 'IN_PROGRESS';
}
