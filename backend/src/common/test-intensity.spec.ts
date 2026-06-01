import {
  DEFAULT_TEST_INTENSITY,
  isTestIntensityLevel,
  TEST_INTENSITY_LEVELS,
  TestIntensityLevel,
} from './test-intensity';

describe('test-intensity', () => {
  it('exposes stable level values', () => {
    expect(TEST_INTENSITY_LEVELS).toEqual([
      'INTERN_ASSOCIATE',
      'SOFTWARE_ENGINEER',
      'SENIOR_DEVELOPER',
    ]);
    expect(TestIntensityLevel.SOFTWARE_ENGINEER).toBe(DEFAULT_TEST_INTENSITY);
  });

  it('validates intensity strings', () => {
    expect(isTestIntensityLevel('SENIOR_DEVELOPER')).toBe(true);
    expect(isTestIntensityLevel('EASY')).toBe(false);
  });
});
