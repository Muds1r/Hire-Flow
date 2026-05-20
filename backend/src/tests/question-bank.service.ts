import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  BankDifficultyTier,
  Prisma,
  QuestionBankEntry,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import type { StoredQuestion } from '../ai/ai.schemas';
import {
  ALL_TIERS,
  BANK_MAX_PER_SKILL,
  BANK_TIER_QUOTAS,
  SECTION_TIER_PICKS,
} from './question-bank-tiers.constants';
import {
  intensityBankTierQuotas,
  INTENSITY_SECTION_TIER_PICKS,
  tierDeficitsForQuotas,
} from './test-intensity.util';
import { TestIntensityLevel } from '../common/test-intensity';
import { normalizeSectionTitle } from '../jobs/section-title.util';
import { QUESTIONS_REQUIRED_PER_SECTION } from './test-build.util';

function bankSkillKey(raw: string): string {
  return normalizeSectionTitle(raw);
}

export type BankDraftQuestion = StoredQuestion & { bankEntryId: string };

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Shuffle MCQ option order and remap correctIndex. */
export function shuffleMcqOptions<
  Q extends { options: [string, string, string, string]; correctIndex: number },
>(q: Q): Q {
  const perm = [0, 1, 2, 3];
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const oldOpts = q.options;
  const newOptions: [string, string, string, string] = [
    oldOpts[perm[0]],
    oldOpts[perm[1]],
    oldOpts[perm[2]],
    oldOpts[perm[3]],
  ];
  const oldCorrect = q.correctIndex;
  const newCorrect = perm.indexOf(oldCorrect);
  return { ...q, options: newOptions, correctIndex: newCorrect };
}

function technologyWhere(canonical: string): Prisma.QuestionBankEntryWhereInput {
  return {
    OR: [
      { technology: { equals: canonical, mode: 'insensitive' } },
      { category: { contains: canonical, mode: 'insensitive' } },
      { technology: { contains: canonical, mode: 'insensitive' } },
    ],
  };
}

@Injectable()
export class QuestionBankService {
  private readonly logger = new Logger(QuestionBankService.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  entryToDraftQuestion(entry: QuestionBankEntry): BankDraftQuestion {
    const base: StoredQuestion = {
      id: randomUUID(),
      question: entry.question,
      options: entry.options as [string, string, string, string],
      correctIndex: entry.correctIndex,
      explanation: entry.explanation,
      category: entry.category || entry.technology,
      difficulty: entry.difficulty,
    };
    const shuffled = shuffleMcqOptions(base);
    return { ...shuffled, bankEntryId: entry.id };
  }

  /**
   * Picks additional MCQ drafts from the bank when AI returns fewer than `count`.
   * Updates `excludeBankEntryIds` with chosen bank entry ids.
   */
  async pickFallbackFromBank(
    canonicalSkill: string,
    count: number,
    excludeBankEntryIds: Set<string>,
  ): Promise<BankDraftQuestion[]> {
    if (count <= 0) {
      return [];
    }
    const skill = bankSkillKey(canonicalSkill);
    if (!skill) {
      return [];
    }
    const pool = await this.prisma.questionBankEntry.findMany({
      where: technologyWhere(skill),
    });
    const avail = shuffleArray(pool).filter((e) => !excludeBankEntryIds.has(e.id));
    const out: BankDraftQuestion[] = [];
    for (const e of avail) {
      if (out.length >= count) {
        break;
      }
      const d = this.entryToDraftQuestion(e);
      excludeBankEntryIds.add(d.bankEntryId);
      out.push(d);
    }
    if (out.length < count) {
      this.logger.warn(
        `pickFallbackFromBank: only ${out.length}/${count} for skill "${skill}" (pool exhausted or excluded)`,
      );
    }
    return out;
  }

  /** Trim AI excess, then fill shortfall from bank so length === need (or throw). */
  async alignAiBatchToCount(
    canonicalSkill: string,
    aiQs: StoredQuestion[],
    need: number,
    excludeBankEntryIds: Set<string>,
  ): Promise<StoredQuestion[]> {
    let trimmed = aiQs.slice(0, need);
    if (aiQs.length > need) {
      this.logger.warn(
        `MCQ batch trimmed before bank align for "${canonicalSkill}": AI ${aiQs.length} → ${need}`,
      );
    }
    if (trimmed.length < need) {
      const short = need - trimmed.length;
      this.logger.warn(
        `MCQ bank fallback for "${canonicalSkill}": filling ${short} slot(s) (have ${trimmed.length}/${need} from AI)`,
      );
      const filler = await this.pickFallbackFromBank(
        canonicalSkill,
        short,
        excludeBankEntryIds,
      );
      trimmed = [...trimmed, ...filler];
    }
    if (trimmed.length < need) {
      throw new BadRequestException(
        `Unable to assemble ${need} questions for "${canonicalSkill}" after AI + bank (have ${trimmed.length}).`,
      );
    }
    return trimmed.slice(0, need);
  }

  async countForSkill(canonical: string): Promise<number> {
    return this.prisma.questionBankEntry.count({
      where: technologyWhere(canonical),
    });
  }

  async countsByTier(
    canonical: string,
  ): Promise<Record<BankDifficultyTier, number>> {
    const rows = await this.prisma.questionBankEntry.groupBy({
      by: ['tier'],
      where: technologyWhere(canonical),
      _count: { _all: true },
    });
    const out: Record<BankDifficultyTier, number> = {
      [BankDifficultyTier.EASY]: 0,
      [BankDifficultyTier.MEDIUM]: 0,
      [BankDifficultyTier.HARD]: 0,
      [BankDifficultyTier.EXPERT]: 0,
    };
    for (const r of rows) {
      out[r.tier] = r._count._all;
    }
    return out;
  }

  private tierDeficits(
    counts: Record<BankDifficultyTier, number>,
    quotas: Record<BankDifficultyTier, number> = BANK_TIER_QUOTAS,
  ): Record<BankDifficultyTier, number> {
    return tierDeficitsForQuotas(counts, quotas);
  }

  private totalDeficit(def: Record<BankDifficultyTier, number>): number {
    return ALL_TIERS.reduce((s, t) => s + def[t], 0);
  }

  private pickTierToFill(def: Record<BankDifficultyTier, number>): BankDifficultyTier | null {
    let best: BankDifficultyTier | null = null;
    let bestN = -1;
    for (const t of ALL_TIERS) {
      if (def[t] > bestN) {
        bestN = def[t];
        best = t;
      }
    }
    return bestN > 0 ? best : null;
  }

  /**
   * Fills the bank for one skill up to BANK_MAX_PER_SKILL with tier quotas (iterative AI batches).
   * Stops when AI is disabled, cap reached, or tier targets are met.
   */
  async fillSkillBankToTierQuotasForJob(params: {
    canonicalSkill: string;
    jobDescription: string;
    intensity?: TestIntensityLevel;
  }): Promise<void> {
    const skill = bankSkillKey(params.canonicalSkill);
    if (!skill) {
      return;
    }
    let guard = 0;
    while (guard < 30) {
      guard += 1;
      const total = await this.countForSkill(skill);
      if (total >= BANK_MAX_PER_SKILL) {
        return;
      }
      const quotas = params.intensity
        ? intensityBankTierQuotas(params.intensity)
        : BANK_TIER_QUOTAS;
      const counts = await this.countsByTier(skill);
      const def = this.tierDeficits(counts, quotas);
      if (this.totalDeficit(def) === 0) {
        return;
      }
      if (!this.ai.canUseAi()) {
        this.logger.warn(
          `fillSkillBankToTierQuotasForJob: AI disabled; stopping for "${skill}" at ${total}/${BANK_MAX_PER_SKILL}`,
        );
        return;
      }
      const tier = this.pickTierToFill(def);
      if (!tier) {
        return;
      }
      const room = BANK_MAX_PER_SKILL - total;
      const tierRoom = def[tier];
      const batchCap = Math.min(10, room, tierRoom);
      if (batchCap < 1) {
        return;
      }
      const qsRaw = await this.ai.generateSectionMcqsForTier({
        sectionTitle: skill,
        jobDescription: params.jobDescription,
        difficultyTier: tier,
        questionCount: batchCap,
      });
      const exclude = new Set<string>();
      const qs = await this.alignAiBatchToCount(skill, qsRaw, batchCap, exclude);
      await this.ingestFromAi(skill, qs, tier);
    }
    this.logger.warn(`fillSkillBankToTierQuotasForJob: iteration cap for "${skill}"`);
  }

  /** Insert AI rows — never delete bank entries elsewhere. */
  async ingestFromAi(
    technology: string,
    questions: StoredQuestion[],
    tier: BankDifficultyTier,
  ): Promise<void> {
    if (questions.length === 0) {
      return;
    }
    const current = await this.countForSkill(technology);
    const room = Math.max(0, BANK_MAX_PER_SKILL - current);
    const slice = questions.slice(0, room);
    if (slice.length === 0) {
      return;
    }
    await this.prisma.questionBankEntry.createMany({
      data: slice.map((q) => ({
        technology,
        question: q.question,
        options: q.options as unknown as object,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        difficulty: q.difficulty,
        tier,
        category: q.category || technology,
      })),
    });
  }

  /**
   * Picks up to `need` entries from the bank (tier-balanced), excluding `usedBankEntryIds`.
   * No AI calls.
   */
  private async pickBalancedBankEntries(
    skill: string,
    need: number,
    usedBankEntryIds: Set<string>,
    tierPicks: Record<BankDifficultyTier, number> = SECTION_TIER_PICKS,
  ): Promise<QuestionBankEntry[]> {
    const picked: QuestionBankEntry[] = [];

    const tryPickTier = async (tier: BankDifficultyTier, want: number) => {
      const pool = await this.prisma.questionBankEntry.findMany({
        where: { AND: [technologyWhere(skill), { tier }] },
      });
      const avail = shuffleArray(pool).filter(
        (e) => !usedBankEntryIds.has(e.id) && !picked.find((p) => p.id === e.id),
      );
      for (const e of avail) {
        if (picked.filter((p) => p.tier === tier).length >= want) {
          break;
        }
        picked.push(e);
      }
    };

    for (const t of ALL_TIERS) {
      await tryPickTier(t, tierPicks[t]);
    }

    if (picked.length < need) {
      const pool = await this.prisma.questionBankEntry.findMany({
        where: technologyWhere(skill),
      });
      const avail = shuffleArray(pool).filter(
        (e) => !usedBankEntryIds.has(e.id) && !picked.find((p) => p.id === e.id),
      );
      for (const e of avail) {
        if (picked.length >= need) {
          break;
        }
        picked.push(e);
      }
    }

    return picked.slice(0, need);
  }

  private finalizeBankDrafts(
    entries: QuestionBankEntry[],
    need: number,
    usedBankEntryIds: Set<string>,
  ): (StoredQuestion & { bankEntryId?: string })[] {
    const drafts = shuffleArray(entries.slice(0, need)).map((e) =>
      this.entryToDraftQuestion(e),
    );
    for (const d of drafts) {
      if (d.bankEntryId) {
        usedBankEntryIds.add(d.bankEntryId);
      }
    }
    return drafts;
  }

  /**
   * Deterministic section build: bank first, at most one AI batch only if short and bank &lt; cap.
   * Never more than `sectionSize` questions (capped at 10). No recursion.
   */
  async selectBalancedQuestionsForSection(params: {
    canonicalSkill: string;
    sectionSize: number;
    usedBankEntryIds: Set<string>;
    jobDescription: string;
    intensity?: TestIntensityLevel;
  }): Promise<(StoredQuestion & { bankEntryId?: string })[]> {
    const skill = bankSkillKey(params.canonicalSkill);
    if (!skill) {
      throw new BadRequestException('Section skill/topic title is required.');
    }
    const need = Math.min(
      QUESTIONS_REQUIRED_PER_SECTION,
      Math.max(1, Math.floor(params.sectionSize)),
    );
    const tierPicks = params.intensity
      ? INTENSITY_SECTION_TIER_PICKS[params.intensity]
      : SECTION_TIER_PICKS;

    const bankFirst = await this.pickBalancedBankEntries(
      skill,
      need,
      params.usedBankEntryIds,
      tierPicks,
    );
    if (bankFirst.length >= need) {
      return this.finalizeBankDrafts(bankFirst, need, params.usedBankEntryIds);
    }

    const short = need - bankFirst.length;
    const bankTotal = await this.countForSkill(skill);

    if (!this.ai.canUseAi()) {
      throw new BadRequestException(
        `Not enough questions in the bank for "${skill}" (${bankFirst.length}/${need}). Configure OPENAI_API_KEY to generate more.`,
      );
    }

    if (bankTotal >= BANK_MAX_PER_SKILL) {
      throw new BadRequestException(
        `Unable to assemble ${need} questions for "${skill}" from the bank (have ${bankFirst.length}); bank for this skill is full (${BANK_MAX_PER_SKILL}) and cannot grow.`,
      );
    }

    const roomInBank = BANK_MAX_PER_SKILL - bankTotal;
    const n = Math.min(short, roomInBank);
    const counts = await this.countsByTier(skill);
    const tier =
      this.pickTierToFill(this.tierDeficits(counts)) ?? BankDifficultyTier.MEDIUM;

    const qsRaw = await this.ai.generateSectionMcqsForTier({
      sectionTitle: skill,
      jobDescription: params.jobDescription,
      difficultyTier: tier,
      questionCount: n,
    });
    const excludeForAlign = new Set(params.usedBankEntryIds);
    const qs = await this.alignAiBatchToCount(skill, qsRaw, n, excludeForAlign);
    await this.ingestFromAi(skill, qs, tier);

    const excludeAfterFirst = new Set(params.usedBankEntryIds);
    for (const entry of bankFirst) {
      excludeAfterFirst.add(entry.id);
    }
    const stillNeed = need - bankFirst.length;
    const bankMore = await this.pickBalancedBankEntries(
      skill,
      stillNeed,
      excludeAfterFirst,
      tierPicks,
    );
    const combined = [...bankFirst, ...bankMore];
    if (combined.length < need) {
      throw new BadRequestException(
        `Unable to assemble ${need} questions for "${skill}" after bank + one AI batch (have ${combined.length}).`,
      );
    }

    return this.finalizeBankDrafts(combined, need, params.usedBankEntryIds);
  }

  async incrementUsage(entryIds: string[]): Promise<void> {
    const unique = [...new Set(entryIds.filter(Boolean))];
    if (unique.length === 0) {
      return;
    }
    await this.prisma.$transaction(
      unique.map((id) =>
        this.prisma.questionBankEntry.update({
          where: { id },
          data: { usageCount: { increment: 1 } },
        }),
      ),
    );
  }

  async recordAttempts(
    rows: { bankEntryId: string; correct: boolean }[],
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    await this.prisma.$transaction(
      rows.map((r) =>
        this.prisma.questionBankEntry.update({
          where: { id: r.bankEntryId },
          data: {
            attemptCount: { increment: 1 },
            successCount: r.correct ? { increment: 1 } : undefined,
            scoreSum: { increment: r.correct ? 1 : 0 },
          },
        }),
      ),
    );
  }
}
