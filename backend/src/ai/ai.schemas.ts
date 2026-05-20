import { z } from 'zod';

export const cvParsedSchema = z.object({
  skills: z.array(z.string()),
  experience: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null ? '' : String(v))),
  tools: z.array(z.string()),
  frameworks: z.array(z.string()),
  languages: z.array(z.string()),
});

export const matchResultSchema = z.object({
  matchScore: z.coerce.number().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  weakAreas: z.array(z.string()),
});

/** Single MCQ item — used for strict and flexible batch parsing. */
export const mcqItemSchema = z.object({
  question: z.string(),
  options: z
    .array(z.string())
    .refine((a) => a.length === 4, 'options must have exactly 4 strings')
    .transform((a) => a as [string, string, string, string]),
  correctIndex: z.coerce.number().int().min(0).max(3),
  explanation: z.string(),
  category: z.string(),
  difficulty: z.coerce.number().int().min(1).max(10),
});

/** AI may return too few or too many questions — normalize downstream; do not require exact length. */
export const questionsBatchFlexibleSchema = z.object({
  questions: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z.array(z.unknown()),
  ),
});

export type CvParsed = z.infer<typeof cvParsedSchema>;
export type MatchResult = z.infer<typeof matchResultSchema>;
export type StoredQuestion = z.infer<typeof mcqItemSchema> & {
  id: string;
};
export type StoredSection = { title: string; questions: StoredQuestion[] };
