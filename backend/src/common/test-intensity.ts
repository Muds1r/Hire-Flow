/**
 * Assessment intensity levels — keep in sync with `TestIntensityLevel` in `prisma/schema.prisma`.
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

export function isTestIntensityLevel(value: unknown): value is TestIntensityLevel {
  return (
    typeof value === 'string' &&
    (TEST_INTENSITY_VALUES as readonly string[]).includes(value)
  );
}
