import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ZodError, z } from 'zod';
import { BankDifficultyTier } from '@prisma/client';
import {
  cvParsedSchema,
  matchResultSchema,
  mcqItemSchema,
  questionsBatchFlexibleSchema,
  type CvParsed,
  type MatchResult,
  type StoredQuestion,
} from './ai.schemas';
import {
  CV_PARSE_SYSTEM,
  JD_MATCH_SYSTEM,
  MCQ_BATCH_SYSTEM,
  cvParseUserPrompt,
  jdMatchUserPrompt,
  mcqBatchForTierUserPrompt,
  mcqCountCorrectionSuffix,
} from './ai.prompts';
import { difficultyIntForTier } from '../tests/question-bank-tiers.constants';

export type {
  CvParsed,
  MatchResult,
  StoredQuestion,
  StoredSection,
} from './ai.schemas';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI | null;

  constructor(private config: ConfigService) {
    const key = config.get<string>('OPENAI_API_KEY')?.trim();
    this.client = key ? new OpenAI({ apiKey: key }) : null;
  }

  canUseAi(): boolean {
    return this.client !== null;
  }

  private requireClient(): OpenAI {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'OPENAI_API_KEY is not configured. Add it to backend/.env to enable AI features.',
      );
    }
    return this.client;
  }

  private model() {
    return this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
  }

  /** JSON chat completion with Zod validation and lightweight retries for flaky JSON. */
  private async jsonCompletion<T>(
    system: string,
    user: string,
    schema: z.ZodType<T>,
    options?: { maxRetries?: number },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 2;
    const openai = this.requireClient();
    let lastErr: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let completion: OpenAI.Chat.Completions.ChatCompletion;
      try {
        completion = await openai.chat.completions.create({
          model: this.model(),
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        lastErr = e;
        if (attempt === maxRetries) {
          throw new BadGatewayException(`OpenAI request failed: ${msg}`);
        }
        this.logger.warn(`OpenAI request attempt ${attempt + 1} failed: ${msg}`);
        continue;
      }

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        lastErr = new ServiceUnavailableException('Empty AI response');
        if (attempt === maxRetries) {
          throw lastErr;
        }
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        lastErr = new ServiceUnavailableException('AI returned invalid JSON');
        if (attempt === maxRetries) {
          throw lastErr;
        }
        this.logger.warn(`Invalid JSON from model (attempt ${attempt + 1})`);
        continue;
      }

      try {
        return schema.parse(parsed);
      } catch (e) {
        lastErr = e;
        if (e instanceof ZodError) {
          this.logger.warn(
            `AI JSON failed schema (attempt ${attempt + 1}): ${e.message}`,
          );
          if (attempt === maxRetries) {
            throw new BadRequestException(
              `AI response did not match expected format after retries: ${e.message}`,
            );
          }
          continue;
        }
        throw e;
      }
    }

    throw lastErr instanceof Error
      ? lastErr
      : new ServiceUnavailableException('AI completion failed');
  }

  async parseCv(cvPlainText: string): Promise<CvParsed> {
    return this.jsonCompletion(
      CV_PARSE_SYSTEM,
      cvParseUserPrompt(cvPlainText),
      cvParsedSchema,
    );
  }

  async matchJdToCv(
    jobDescription: string,
    cvPlainText: string,
    cvParsed: CvParsed,
  ): Promise<MatchResult> {
    return this.jsonCompletion(
      JD_MATCH_SYSTEM,
      jdMatchUserPrompt(jobDescription, cvPlainText, cvParsed),
      matchResultSchema,
    );
  }

  private sanitizeMcqRows(rows: unknown[]): z.infer<typeof mcqItemSchema>[] {
    const out: z.infer<typeof mcqItemSchema>[] = [];
    for (const row of rows) {
      const r = mcqItemSchema.safeParse(row);
      if (r.success) {
        out.push(r.data);
      }
    }
    return out;
  }

  /**
   * Parses flexible JSON, trims excess, retries once if short, logs counts.
   * May still return fewer than `expectedCount` — caller must fill from bank.
   */
  private async fetchMcqBatchWithRetry(params: {
    baseUserPrompt: string;
    expectedCount: number;
    sectionTitle: string;
  }): Promise<z.infer<typeof mcqItemSchema>[]> {
    const { baseUserPrompt, expectedCount, sectionTitle } = params;
    const first = await this.jsonCompletion(
      MCQ_BATCH_SYSTEM,
      baseUserPrompt,
      questionsBatchFlexibleSchema,
    );
    let items = this.sanitizeMcqRows(first.questions ?? []);
    this.logger.log(
      `MCQ AI first pass for "${sectionTitle}": received ${items.length} valid / expected ${expectedCount}`,
    );
    if (items.length > expectedCount) {
      this.logger.warn(
        `MCQ AI excess trimmed for "${sectionTitle}": ${items.length} → ${expectedCount}`,
      );
      items = items.slice(0, expectedCount);
    }
    if (items.length < expectedCount) {
      this.logger.warn(
        `MCQ AI short for "${sectionTitle}": ${items.length}/${expectedCount}, retrying with count correction`,
      );
      const second = await this.jsonCompletion(
        MCQ_BATCH_SYSTEM,
        `${baseUserPrompt}${mcqCountCorrectionSuffix(items.length, expectedCount)}`,
        questionsBatchFlexibleSchema,
      );
      const retryItems = this.sanitizeMcqRows(second.questions ?? []);
      this.logger.log(
        `MCQ AI retry for "${sectionTitle}": received ${retryItems.length} valid / expected ${expectedCount}`,
      );
      if (retryItems.length >= items.length) {
        items = retryItems;
      }
      if (items.length > expectedCount) {
        items = items.slice(0, expectedCount);
      }
    }
    return items.slice(0, expectedCount);
  }

  async generateSectionMcqsForTier(params: {
    sectionTitle: string;
    jobDescription: string;
    questionCount?: number;
    difficultyTier: BankDifficultyTier;
  }): Promise<StoredQuestion[]> {
    const n = params.questionCount ?? 10;
    if (n < 1 || n > 15) {
      throw new BadRequestException('questionCount must be between 1 and 15');
    }
    const baseUserPrompt = mcqBatchForTierUserPrompt({
      sectionTitle: params.sectionTitle,
      jobDescription: params.jobDescription,
      questionCount: n,
      difficultyTier: params.difficultyTier,
    });
    const items = await this.fetchMcqBatchWithRetry({
      baseUserPrompt,
      expectedCount: n,
      sectionTitle: params.sectionTitle,
    });
    const crypto = await import('crypto');
    const d = difficultyIntForTier(params.difficultyTier);
    return items.map((q) => ({
      ...q,
      id: crypto.randomUUID(),
      difficulty: d,
    }));
  }

}
