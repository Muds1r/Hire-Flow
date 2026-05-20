import type { Job } from '../types';

export type AssessmentBankPrepPhase =
  | 'NOT_STARTED'
  | 'FILLING_QUESTIONS'
  | 'READY'
  | 'FAILED';

export function bankPrepBadge(job: {
  assessmentBankReady?: boolean;
  assessmentBankPrepPhase?: AssessmentBankPrepPhase | string | null;
  assessmentSectionTitles?: string[] | null;
}): { label: string; className: string; title: string } | null {
  const hasTopics =
    Array.isArray(job.assessmentSectionTitles) &&
    job.assessmentSectionTitles.length > 0;

  if (!hasTopics) {
    return null;
  }

  if (job.assessmentBankReady) {
    return {
      label: 'Bank ready',
      className: 'text-navy',
      title: 'Question bank is ready for this job.',
    };
  }

  const phase = job.assessmentBankPrepPhase;
  switch (phase) {
    case 'FILLING_QUESTIONS':
      return {
        label: 'Questions preparing',
        className: 'text-amber-800',
        title: 'Building or topping up the question bank for selected topics.',
      };
    case 'FAILED':
      return {
        label: 'Prep failed',
        className: 'text-red-800',
        title: 'Bank preparation failed. Check backend logs and try a new job.',
      };
    case 'NOT_STARTED':
    default:
      return {
        label: 'Bank prep…',
        className: 'text-amber-800',
        title: 'Question bank preparation is starting.',
      };
  }
}

export function bankPrepWaitMessage(
  job: Pick<Job, 'assessmentBankPrepPhase' | 'assessmentBankReady'> | undefined,
): string {
  if (!job || job.assessmentBankReady) {
    return 'Job question bank is still preparing. Generate test will be available when the bank is ready.';
  }
  switch (job.assessmentBankPrepPhase) {
    case 'FILLING_QUESTIONS':
      return 'Questions are being added to the bank. Generate test will unlock when preparation finishes.';
    case 'FAILED':
      return 'Bank preparation failed for this job. Check server logs or publish a new job.';
    default:
      return 'Job question bank is still preparing. Generate test will be available when the bank is ready.';
  }
}
