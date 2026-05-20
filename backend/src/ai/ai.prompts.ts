import type { CvParsed } from './ai.schemas';

export const CV_PARSE_SYSTEM =
  'You extract structured resume data. Reply with JSON only matching the user schema.';

export function cvParseUserPrompt(cvPlainText: string): string {
  const text = cvPlainText.slice(0, 12000);
  return `From this CV text, extract: skills (array), experience (short summary string), tools (array), frameworks (array), languages (programming/natural if listed). CV:\n${text}`;
}

export const JD_MATCH_SYSTEM =
  'You compare a CV to a job description. Return JSON only.';

export function jdMatchUserPrompt(
  jobDescription: string,
  cvPlainText: string,
  cvParsed: CvParsed,
): string {
  const jd = jobDescription.slice(0, 12000);
  const cv = cvPlainText.slice(0, 8000);
  return `Job description:\n${jd}\n\nCV text:\n${cv}\n\nParsed CV JSON:\n${JSON.stringify(cvParsed)}\n\nReturn matchScore 0-100, matchedSkills, missingSkills, weakAreas (arrays of short strings).`;
}

export const MCQ_BATCH_SYSTEM =
  'You write technical interview MCQs. Return JSON only. Each question must have exactly 4 options.';

/** Appended to a failed-count MCQ request for a single strict retry. */
export function mcqCountCorrectionSuffix(receivedCount: number, expectedCount: number): string {
  return `

CRITICAL CORRECTION:
You returned ${receivedCount} valid question(s). You MUST return exactly ${expectedCount} questions in valid JSON format.
The top-level object must be: { "questions": [ /* exactly ${expectedCount} question objects */ ] }
Each question object must have: question (string), options (array of exactly 4 strings), correctIndex (0-3), explanation (string), category (string), difficulty (integer 1-10).`;
}

export function mcqBatchForTierUserPrompt(params: {
  sectionTitle: string;
  jobDescription: string;
  questionCount: number;
  difficultyTier: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
}): string {
  const jd = params.jobDescription.slice(0, 6000);
  const n = params.questionCount;
  const tierGuide: Record<string, string> = {
    EASY: 'Entry-level: fundamentals, common syntax, and basic concepts only.',
    MEDIUM: 'Working-level: practical scenarios a mid-level developer handles daily.',
    HARD: 'Advanced: edge cases, performance, internals, or tricky debugging.',
    EXPERT: 'Expert / staff-level: architecture trade-offs, deep framework internals, or rare pitfalls.',
  };
  const guide = tierGuide[params.difficultyTier] ?? tierGuide.MEDIUM;
  return `Topic/section: "${params.sectionTitle}".
Difficulty tier: ${params.difficultyTier}.
${guide}
Generate exactly ${n} multiple-choice questions, ALL at this tier (do not mix easier or harder tiers).
Each question: question (string), options (array of exactly 4 distinct strings), correctIndex (0-3), explanation (string), category (string, usually the section title), difficulty (integer 1-10 consistent with the tier — EASY≈2, MEDIUM≈5, HARD≈7, EXPERT≈9).

Job description:
${jd}`;
}

