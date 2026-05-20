/** Test attempt is finished enough for HR “View result” (answers may exist; grading may follow). */
export function isTestAttemptFinishedForHr(status: string): boolean {
  return status === 'SUBMITTED' || status === 'AUTO_SUBMITTED' || status === 'GRADED';
}
