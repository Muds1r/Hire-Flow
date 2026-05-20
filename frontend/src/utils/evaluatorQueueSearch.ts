type CandidateLike = {
  email?: string;
  name?: string | null;
};

/** Case-insensitive match on candidate email or display name. */
export function matchesEvaluatorQueueSearch(
  candidate: CandidateLike | undefined,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  if (!candidate) {
    return false;
  }
  const email = candidate.email?.toLowerCase() ?? '';
  const name = candidate.name?.trim().toLowerCase() ?? '';
  return email.includes(q) || name.includes(q);
}

export function evaluatorQueueCandidateLines(
  candidate: CandidateLike | undefined,
): { primary: string; secondary: string | null } {
  if (!candidate?.email) {
    return { primary: 'Unknown candidate', secondary: null };
  }
  const name = candidate.name?.trim();
  if (name) {
    return { primary: name, secondary: candidate.email };
  }
  return { primary: candidate.email, secondary: null };
}
