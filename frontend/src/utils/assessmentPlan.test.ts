import { describe, expect, it } from 'vitest';
import { getJobAssessmentSections } from './assessmentPlan';

describe('getJobAssessmentSections', () => {
  it('reads section titles from assessmentSectionConfig', () => {
    const sections = getJobAssessmentSections({
      assessmentSectionConfig: [
        { title: 'JavaScript', intensity: 'SOFTWARE_ENGINEER' },
        { title: 'SQL', intensity: 'SOFTWARE_ENGINEER' },
      ],
    });
    expect(sections).toEqual(['JavaScript', 'SQL']);
  });

  it('falls back to assessmentSectionTitles', () => {
    expect(
      getJobAssessmentSections({
        assessmentSectionTitles: ['React', 'Node.js'],
      }),
    ).toEqual(['React', 'Node.js']);
  });
});
