import { getJobAssessmentSections } from '../../utils/assessmentPlan';
import type { JobSectionConfig } from '../../types';

type Props = {
  job: {
    assessmentSectionConfig?: JobSectionConfig[] | unknown | null;
    assessmentSectionTitles?: string[] | null;
  };
  label?: string;
  className?: string;
  /** Show 1, 2, 3… order for HR review. */
  numbered?: boolean;
};

export function AssessmentPlanSectionsList({
  job,
  label = 'Sections selected by evaluator',
  className = '',
  numbered = false,
}: Props) {
  const sections = getJobAssessmentSections(job);
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      ) : null}
      <ul
        className={['flex flex-wrap gap-1.5', label ? 'mt-2' : ''].join(' ')}
        aria-label={label || 'Assessment sections'}
      >
        {sections.map((title, index) => (
          <li
            key={title}
            className="inline-flex max-w-full items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-800 ring-1 ring-slate-200/90"
          >
            {numbered ? (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-mint-light text-[10px] font-bold text-navy ring-1 ring-mint/30">
                {index + 1}
              </span>
            ) : null}
            <span className="truncate">{title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
