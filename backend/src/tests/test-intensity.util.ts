import { BankDifficultyTier } from '@prisma/client';
import { TestIntensityLevel } from '../common/test-intensity';
import { ALL_TIERS } from './question-bank-tiers.constants';

/** Per-section MCQ tier picks (10 questions) by evaluator intensity choice. */
export const INTENSITY_SECTION_TIER_PICKS: Record<
  TestIntensityLevel,
  Record<BankDifficultyTier, number>
> = {
  [TestIntensityLevel.INTERN_ASSOCIATE]: {
    [BankDifficultyTier.EASY]: 4,
    [BankDifficultyTier.MEDIUM]: 4,
    [BankDifficultyTier.HARD]: 2,
    [BankDifficultyTier.EXPERT]: 0,
  },
  [TestIntensityLevel.SOFTWARE_ENGINEER]: {
    [BankDifficultyTier.EASY]: 2,
    [BankDifficultyTier.MEDIUM]: 3,
    [BankDifficultyTier.HARD]: 3,
    [BankDifficultyTier.EXPERT]: 2,
  },
  [TestIntensityLevel.SENIOR_DEVELOPER]: {
    [BankDifficultyTier.EASY]: 1,
    [BankDifficultyTier.MEDIUM]: 2,
    [BankDifficultyTier.HARD]: 4,
    [BankDifficultyTier.EXPERT]: 3,
  },
};

/** Bank fill targets (50 per skill) biased by intensity when growing the pool. */
export function intensityBankTierQuotas(
  intensity: TestIntensityLevel,
): Record<BankDifficultyTier, number> {
  switch (intensity) {
    case TestIntensityLevel.INTERN_ASSOCIATE:
      return {
        [BankDifficultyTier.EASY]: 20,
        [BankDifficultyTier.MEDIUM]: 20,
        [BankDifficultyTier.HARD]: 10,
        [BankDifficultyTier.EXPERT]: 0,
      };
    case TestIntensityLevel.SENIOR_DEVELOPER:
      return {
        [BankDifficultyTier.EASY]: 5,
        [BankDifficultyTier.MEDIUM]: 10,
        [BankDifficultyTier.HARD]: 20,
        [BankDifficultyTier.EXPERT]: 15,
      };
    default:
      return {
        [BankDifficultyTier.EASY]: 10,
        [BankDifficultyTier.MEDIUM]: 15,
        [BankDifficultyTier.HARD]: 15,
        [BankDifficultyTier.EXPERT]: 10,
      };
  }
}

export function tierDeficitsForQuotas(
  counts: Record<BankDifficultyTier, number>,
  quotas: Record<BankDifficultyTier, number>,
): Record<BankDifficultyTier, number> {
  const d = {} as Record<BankDifficultyTier, number>;
  for (const t of ALL_TIERS) {
    d[t] = Math.max(0, quotas[t] - counts[t]);
  }
  return d;
}
