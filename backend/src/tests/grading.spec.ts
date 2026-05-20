import { computeTestScore } from './grading';

describe('computeTestScore', () => {
  const sections = [
    {
      title: 'JavaScript',
      orderIndex: 0,
      questions: [
        { id: 'q1', correctIndex: 1, orderIndex: 0 },
        { id: 'q2', correctIndex: 0, orderIndex: 1 },
      ],
    },
    {
      title: 'React',
      orderIndex: 1,
      questions: [{ id: 'q3', correctIndex: 2, orderIndex: 0 }],
    },
  ];

  it('scores correct answers per section', () => {
    const result = computeTestScore(sections, [
      { questionId: 'q1', selectedOption: 1 },
      { questionId: 'q2', selectedOption: 9 },
      { questionId: 'q3', selectedOption: 2 },
    ]);

    expect(result.correct).toBe(2);
    expect(result.max).toBe(3);
    expect(result.sectionScores.JavaScript).toEqual({ correct: 1, total: 2 });
    expect(result.sectionScores.React).toEqual({ correct: 1, total: 1 });
    expect(result.perQuestion).toHaveLength(3);
    expect(result.perQuestion[0].correct).toBe(true);
    expect(result.perQuestion[1].correct).toBe(false);
  });

  it('treats missing answers as incorrect', () => {
    const result = computeTestScore(sections, []);
    expect(result.correct).toBe(0);
    expect(result.max).toBe(3);
  });
});
