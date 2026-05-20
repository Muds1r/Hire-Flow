import {
  DEFAULT_QUESTION_SECONDS,
  QUESTIONS_PER_SECTION,
} from '../constants/assessment';
import { TEST_INTENSITY_OPTIONS, type TestIntensityLevel } from '../constants/testIntensity';
import type { JobSectionConfig } from '../types';
import { parseJobAssessmentSectionConfig } from './jobSectionConfig';

export function intensityLabel(value: TestIntensityLevel): string {
  return TEST_INTENSITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** e.g. "3 sections · 30 questions · 12m 30s total timer" */
export function formatAssessmentPlanSummary(sectionCount: number): string {
  if (sectionCount <= 0) {
    return '';
  }
  const questionCount = sectionCount * QUESTIONS_PER_SECTION;
  const timerSeconds = questionCount * DEFAULT_QUESTION_SECONDS;
  const timerMin = Math.floor(timerSeconds / 60);
  const timerSec = timerSeconds % 60;
  const timerLabel =
    timerSec === 0 ? `${timerMin} min` : `${timerMin}m ${timerSec}s`;
  return `${sectionCount} section${sectionCount === 1 ? '' : 's'} · ${questionCount} questions · ${timerLabel} total timer`;
}

type JobPlanSource = {
  assessmentSectionConfig?: JobSectionConfig[] | unknown | null;
  assessmentSectionTitles?: string[] | null;
};

/** Section titles only (intensity is shown once in `jobAssessmentPlanSummary`). */
export function getJobAssessmentSections(job: JobPlanSource): string[] {
  const config = parseJobAssessmentSectionConfig(job.assessmentSectionConfig);
  if (config?.length) {
    return config.map((c) => c.title);
  }

  const titles = job.assessmentSectionTitles;
  if (!Array.isArray(titles)) {
    return [];
  }
  return titles.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim());
}

/** HR rows: full plan line from evaluator config (preferred) or legacy title list. */
export function jobAssessmentPlanSummary(job: JobPlanSource): string | null {
  const config = parseJobAssessmentSectionConfig(job.assessmentSectionConfig);
  if (config?.length) {
    const base = formatAssessmentPlanSummary(config.length);
    const intensityLabels = [
      ...new Set(config.map((c) => intensityLabel(c.intensity))),
    ];
    const intensityPart =
      intensityLabels.length === 1
        ? `${intensityLabels[0]} overall`
        : intensityLabels.join(', ');
    return `${base} · ${intensityPart}`;
  }

  const titles = job.assessmentSectionTitles;
  if (!Array.isArray(titles) || titles.length === 0) {
    return null;
  }
  const count = titles.filter(
    (t) => typeof t === 'string' && t.trim().length > 0,
  ).length;
  return count > 0 ? formatAssessmentPlanSummary(count) : null;
}
