/**
 * Pure scoring for MCQ tests (no DB / no side effects).
 * Used by candidate submit flow and HR repair grading.
 */

export type GradingQuestion = {
  id: string;
  correctIndex: number;
  orderIndex: number;
};

export type GradingSection = {
  title: string;
  orderIndex: number;
  questions: GradingQuestion[];
};

export type GradingAnswer = {
  questionId: string;
  selectedOption: number | null;
};

export type PerQuestionGrade = {
  questionId: string;
  sectionIndex: number;
  questionIndex: number;
  correct: boolean;
  selectedOption: number | null;
  correctIndex: number;
};

export type TestScoreResult = {
  correct: number;
  max: number;
  sectionScores: Record<string, { correct: number; total: number }>;
  perQuestion: PerQuestionGrade[];
};

export function computeTestScore(
  testSections: GradingSection[],
  answers: GradingAnswer[],
): TestScoreResult {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  const sections = [...testSections].sort((a, b) => a.orderIndex - b.orderIndex);

  let correct = 0;
  let max = 0;
  const sectionScores: Record<string, { correct: number; total: number }> = {};
  const perQuestion: PerQuestionGrade[] = [];

  let sectionIndex = 0;
  for (const sec of sections) {
    const keyBase = sec.title;
    if (!sectionScores[keyBase]) {
      sectionScores[keyBase] = { correct: 0, total: 0 };
    }
    const questions = [...sec.questions].sort((a, b) => a.orderIndex - b.orderIndex);
    let questionIndex = 0;
    for (const q of questions) {
      max += 1;
      sectionScores[keyBase].total += 1;
      const ans = answerMap.get(q.id);
      const selected = ans?.selectedOption ?? null;
      const answered =
        selected !== null && selected !== undefined;
      const isCorrect = answered && selected === q.correctIndex;
      if (isCorrect) {
        correct += 1;
        sectionScores[keyBase].correct += 1;
      }
      perQuestion.push({
        questionId: q.id,
        sectionIndex,
        questionIndex,
        correct: isCorrect,
        selectedOption: selected,
        correctIndex: q.correctIndex,
      });
      questionIndex += 1;
    }
    sectionIndex += 1;
  }

  return { correct, max, sectionScores, perQuestion };
}
