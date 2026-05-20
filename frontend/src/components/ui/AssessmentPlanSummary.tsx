import {
  formatAssessmentPlanSummary,
  jobAssessmentPlanSummary,
} from '../../utils/assessmentPlan';
import type { JobSectionConfig } from '../../types';

type Props = {
  /** Live editor: section count only. */
  sectionCount?: number;
  /** Job row: reads config or titles from job. */
  job?: {
    assessmentSectionConfig?: JobSectionConfig[] | unknown | null;
    assessmentSectionTitles?: string[] | null;
  } | null;
  className?: string;
  /** Card style for HR ready-to-publish rows. */
  variant?: 'inline' | 'card';
};

export function AssessmentPlanSummary({
  sectionCount,
  job,
  className = 'text-xs text-slate-600',
  variant = 'inline',
}: Props) {
  const text =
    sectionCount != null && sectionCount > 0
      ? formatAssessmentPlanSummary(sectionCount)
      : job
        ? jobAssessmentPlanSummary(job)
        : null;

  if (!text) {
    return null;
  }

  if (variant === 'card') {
    return (
      <div
        className={[
          'rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2',
          className,
        ].join(' ')}
      >
        <p className="text-xs font-medium leading-relaxed text-slate-700">{text}</p>
      </div>
    );
  }

  return <p className={className}>{text}</p>;
}
