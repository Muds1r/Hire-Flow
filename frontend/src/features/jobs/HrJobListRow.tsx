import { Link } from 'react-router-dom';
import type { Job } from '../../types';
import { BankPrepBadge } from '../../components/BankPrepBadge';
import { AssessmentPlanSummary } from '../../components/ui/AssessmentPlanSummary';

type Props = {
  job: Job;
  linkPrefix?: string;
};

export function HrJobListRow({ job, linkPrefix }: Props) {
  const awaitingEvaluator = !job.publishedAt && !job.evaluatorConfigSubmittedAt;
  const hasPlan =
    !!job.evaluatorConfigSubmittedAt ||
    (Array.isArray(job.assessmentSectionTitles) &&
      job.assessmentSectionTitles.length > 0);

  return (
    <li className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {linkPrefix ? (
          <Link
            className="font-medium text-navy hover:text-mint-dark hover:underline"
            to={`${linkPrefix}/${job.id}`}
          >
            {job.title}
          </Link>
        ) : (
          <span className="font-medium text-slate-900">{job.title}</span>
        )}
        {awaitingEvaluator ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
            Awaiting evaluator
          </span>
        ) : (
          <BankPrepBadge job={job} />
        )}
      </div>
      {awaitingEvaluator ? (
        <p className="mt-1 text-xs text-slate-600">
          Sent to evaluator
          {job.jobEvaluators?.length
            ? `: ${job.jobEvaluators.map((r) => r.evaluator.name ?? r.evaluator.email).join(', ')}`
            : ''}
        </p>
      ) : hasPlan ? (
        <AssessmentPlanSummary job={job} className="mt-1 text-xs text-slate-600" />
      ) : (
        <p className="mt-1 text-xs text-slate-500">Assessment plan pending.</p>
      )}
    </li>
  );
}
