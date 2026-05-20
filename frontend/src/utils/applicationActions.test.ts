import { describe, expect, it } from 'vitest';
import { getApplicationActions } from './applicationActions';

describe('getApplicationActions', () => {
  it('hides generate/send for terminal rejected applications', () => {
    const actions = getApplicationActions(
      { status: 'REJECTED', evaluatorAssignmentCount: 0 },
      { status: 'GRADED' },
    );
    expect(actions.generateTestVisible).toBe(false);
    expect(actions.sendTestVisible).toBe(false);
    expect(actions.showResultVisible).toBe(true);
  });

  it('shows generate for applied without test', () => {
    const actions = getApplicationActions(
      { status: 'APPLIED', evaluatorAssignmentCount: 0 },
      undefined,
    );
    expect(actions.generateTestVisible).toBe(true);
    expect(actions.sendTestVisible).toBe(false);
  });
});
