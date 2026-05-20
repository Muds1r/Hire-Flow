import { Prisma, TestStatus } from '@prisma/client';
import type { StoredSection } from '../ai/ai.schemas';

export const QUESTIONS_REQUIRED_PER_SECTION = 10;

/** Stored or DB section: exactly the required number of question rows. */
export function isSectionComplete(section: { questions: unknown[] }): boolean {
  return (
    Array.isArray(section.questions) &&
    section.questions.length === QUESTIONS_REQUIRED_PER_SECTION
  );
}

type QuestionRowLike = {
  question: string;
  options: Prisma.JsonValue;
  correctIndex: number;
};

/** Validates one MCQ row (DB or in-memory). */
export function isQuestionRowValid(q: QuestionRowLike): boolean {
  if (!q.question?.trim()) {
    return false;
  }
  if (
    q.correctIndex == null ||
    !Number.isInteger(q.correctIndex) ||
    q.correctIndex < 0 ||
    q.correctIndex > 3
  ) {
    return false;
  }
  const opts = q.options;
  if (!Array.isArray(opts) || opts.length !== 4) {
    return false;
  }
  return opts.every((o) => typeof o === 'string' && String(o).trim().length > 0);
}

type SectionWithQuestions = {
  orderIndex: number;
  questions: Array<
    QuestionRowLike & {
      orderIndex: number;
    }
  >;
};

/** Section/question structure only (ignores test status). */
export function isTestContentComplete(test: {
  testSections: SectionWithQuestions[];
}): boolean {
  const sections = [...test.testSections].sort((a, b) => a.orderIndex - b.orderIndex);
  if (sections.length === 0) {
    return false;
  }
  for (const sec of sections) {
    const qs = [...sec.questions].sort((a, b) => a.orderIndex - b.orderIndex);
    if (!isSectionComplete({ questions: qs })) {
      return false;
    }
    for (const q of qs) {
      if (!isQuestionRowValid(q)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * True when the test may be sent: DRAFT, at least one section,
 * and every section has exactly QUESTIONS_REQUIRED_PER_SECTION valid questions.
 */
export function isTestFullyBuilt(test: {
  status: TestStatus | string;
  testSections: SectionWithQuestions[];
}): boolean {
  if (test.status !== TestStatus.DRAFT) {
    return false;
  }
  return isTestContentComplete(test);
}

/** After AI/bank assembly, before persisting a DRAFT test. */
export function areStoredSectionsFullyBuilt(sections: StoredSection[]): boolean {
  if (!sections.length) {
    return false;
  }
  for (const sec of sections) {
    if (!isSectionComplete(sec)) {
      return false;
    }
    for (const q of sec.questions) {
      if (
        !isQuestionRowValid({
          question: q.question,
          options: q.options as unknown as Prisma.JsonValue,
          correctIndex: q.correctIndex,
        })
      ) {
        return false;
      }
    }
  }
  return true;
}
