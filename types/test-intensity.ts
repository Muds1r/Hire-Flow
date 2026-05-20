/**
 * Single source of truth for assessment intensity levels.
 * Keep in sync with `TestIntensityLevel` in `backend/prisma/schema.prisma`.
 */

export const TEST_INTENSITY_LEVELS = [
  'INTERN_ASSOCIATE',
  'SOFTWARE_ENGINEER',
  'SENIOR_DEVELOPER',
] as const;

export const TestIntensityLevel = {
  INTERN_ASSOCIATE: 'INTERN_ASSOCIATE',
  SOFTWARE_ENGINEER: 'SOFTWARE_ENGINEER',
  SENIOR_DEVELOPER: 'SENIOR_DEVELOPER',
} as const satisfies Record<
  (typeof TEST_INTENSITY_LEVELS)[number],
  (typeof TEST_INTENSITY_LEVELS)[number]
>;

export type TestIntensityLevel = (typeof TEST_INTENSITY_LEVELS)[number];

export const TEST_INTENSITY_VALUES: TestIntensityLevel[] = [
  ...TEST_INTENSITY_LEVELS,
];

export const DEFAULT_TEST_INTENSITY: TestIntensityLevel =
  TestIntensityLevel.SOFTWARE_ENGINEER;

export const TEST_INTENSITY_OPTIONS: readonly {
  value: TestIntensityLevel;
  label: string;
  hint: string;
}[] = [
  {
    value: TestIntensityLevel.INTERN_ASSOCIATE,
    label: 'Internship / Associate',
    hint: 'Easier MCQs — more foundational questions',
  },
  {
    value: TestIntensityLevel.SOFTWARE_ENGINEER,
    label: 'Software engineer',
    hint: 'Balanced difficulty across tiers',
  },
  {
    value: TestIntensityLevel.SENIOR_DEVELOPER,
    label: 'Senior developer',
    hint: 'Harder MCQs — advanced and expert-heavy',
  },
] as const;

export function isTestIntensityLevel(value: unknown): value is TestIntensityLevel {
  return (
    typeof value === 'string' &&
    (TEST_INTENSITY_VALUES as readonly string[]).includes(value)
  );
}
