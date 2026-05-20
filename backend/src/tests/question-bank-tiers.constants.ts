import { BankDifficultyTier } from '@prisma/client';

/** Max questions per skill category in the permanent bank. */
export const BANK_MAX_PER_SKILL = 50;

/** Target counts per tier (10 + 15 + 15 + 10 = 50). */
export const BANK_TIER_QUOTAS: Record<BankDifficultyTier, number> = {
  EASY: 10,
  MEDIUM: 15,
  HARD: 15,
  EXPERT: 10,
};

/** Per-section pick (10 questions): proportional to quotas. */
export const SECTION_TIER_PICKS: Record<BankDifficultyTier, number> = {
  EASY: 2,
  MEDIUM: 3,
  HARD: 3,
  EXPERT: 2,
};

export const ALL_TIERS: BankDifficultyTier[] = [
  BankDifficultyTier.EASY,
  BankDifficultyTier.MEDIUM,
  BankDifficultyTier.HARD,
  BankDifficultyTier.EXPERT,
];

export function difficultyIntForTier(tier: BankDifficultyTier): number {
  switch (tier) {
    case BankDifficultyTier.EASY:
      return 2;
    case BankDifficultyTier.MEDIUM:
      return 5;
    case BankDifficultyTier.HARD:
      return 7;
    case BankDifficultyTier.EXPERT:
      return 9;
    default:
      return 5;
  }
}
