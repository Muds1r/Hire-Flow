import { describe, expect, it } from 'vitest';
import {
  evaluatorQueueCandidateLines,
  matchesEvaluatorQueueSearch,
} from './evaluatorQueueSearch';

describe('matchesEvaluatorQueueSearch', () => {
  it('matches email and name substrings', () => {
    const candidate = { email: 'jane@example.com', name: 'Jane Doe' };
    expect(matchesEvaluatorQueueSearch(candidate, '')).toBe(true);
    expect(matchesEvaluatorQueueSearch(candidate, 'jane@')).toBe(true);
    expect(matchesEvaluatorQueueSearch(candidate, 'DOE')).toBe(true);
    expect(matchesEvaluatorQueueSearch(candidate, 'bob')).toBe(false);
  });
});

describe('evaluatorQueueCandidateLines', () => {
  it('prefers name with email as secondary', () => {
    expect(
      evaluatorQueueCandidateLines({ email: 'a@b.com', name: 'Alex' }),
    ).toEqual({ primary: 'Alex', secondary: 'a@b.com' });
  });

  it('falls back to email only', () => {
    expect(evaluatorQueueCandidateLines({ email: 'a@b.com' })).toEqual({
      primary: 'a@b.com',
      secondary: null,
    });
  });
});
