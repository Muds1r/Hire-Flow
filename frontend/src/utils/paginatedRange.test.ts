import { describe, expect, it } from 'vitest';
import { paginatedRange } from './paginatedRange';

describe('paginatedRange', () => {
  it('returns zeros when total is 0', () => {
    expect(paginatedRange(1, 10, 0)).toEqual({ rangeStart: 0, rangeEnd: 0 });
  });

  it('computes range for first page', () => {
    expect(paginatedRange(1, 10, 25)).toEqual({ rangeStart: 1, rangeEnd: 10 });
  });

  it('computes range for last partial page', () => {
    expect(paginatedRange(3, 10, 25)).toEqual({ rangeStart: 21, rangeEnd: 25 });
  });
});
