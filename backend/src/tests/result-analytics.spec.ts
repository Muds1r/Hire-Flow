import { buildResultAnalytics, questionTierLabel } from './result-analytics';

describe('questionTierLabel', () => {
  it('maps difficulty to tiers', () => {
    expect(questionTierLabel(2)).toBe('easy');
    expect(questionTierLabel(5)).toBe('medium');
    expect(questionTierLabel(8)).toBe('hard');
    expect(questionTierLabel(10)).toBe('expert');
  });
});

describe('buildResultAnalytics', () => {
  it('builds section performance with tier breakdown', () => {
    const score = {
      correct: 2,
      max: 3,
      sectionScores: {
        JS: { correct: 2, total: 2 },
        React: { correct: 0, total: 1 },
      },
      perQuestion: [
        {
          questionId: 'a',
          sectionIndex: 0,
          questionIndex: 0,
          correct: true,
          selectedOption: 0,
          correctIndex: 0,
        },
        {
          questionId: 'b',
          sectionIndex: 0,
          questionIndex: 1,
          correct: true,
          selectedOption: 1,
          correctIndex: 1,
        },
        {
          questionId: 'c',
          sectionIndex: 1,
          questionIndex: 0,
          correct: false,
          selectedOption: 0,
          correctIndex: 2,
        },
      ],
    };

    const meta = new Map([
      ['a', { difficulty: 2 }],
      ['b', { difficulty: 5 }],
      ['c', { difficulty: 7 }],
    ]);

    const analytics = buildResultAnalytics({
      score,
      perQuestionMeta: meta,
      sectionTitlesByIndex: ['JS', 'React'],
      durationMs: 120_000,
    });

    expect(analytics.completionTimeMs).toBe(120_000);
    expect(analytics.sectionPerformance.JS.correct).toBe(2);
    expect(analytics.sectionPerformance.JS.tiers.easy.total).toBe(1);
    expect(analytics.sectionPerformance.JS.tiers.medium.total).toBe(1);
    expect(analytics.sectionPerformance.React.correct).toBe(0);
    expect(analytics.sectionPerformance.React.tiers.hard.total).toBe(1);
  });
});
