import { describe, expect, it } from 'vitest';
import { resolveRejectionReason } from './applicationStatusDisplay';

describe('resolveRejectionReason', () => {
  it('returns explicit HR_MANUAL', () => {
    expect(
      resolveRejectionReason({
        status: 'REJECTED',
        rejectionReason: 'HR_MANUAL',
      }),
    ).toBe('HR_MANUAL');
  });

  it('infers JOB_CLOSED when rejected near job close time', () => {
    const closedAt = '2026-01-15T12:00:00.000Z';
    expect(
      resolveRejectionReason({
        status: 'REJECTED',
        updatedAt: '2026-01-15T12:01:00.000Z',
        job: { closedAt },
      }),
    ).toBe('JOB_CLOSED');
  });

  it('returns null for non-rejected status without reason', () => {
    expect(
      resolveRejectionReason({
        status: 'APPLIED',
        rejectionReason: null,
      }),
    ).toBeNull();
  });
});
