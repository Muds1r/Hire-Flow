import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '../../services/http';
import type { Job } from '../../types';
import { queryKeys } from '../../hooks/queryKeys';
import { invalidateHrJobsQueries } from './invalidateHrJobs';
import { AssessmentPlanSummary } from '../../components/ui/AssessmentPlanSummary';
import { AssessmentPlanSectionsList } from '../../components/ui/AssessmentPlanSectionsList';

type Props = {
  job: Job;
};

export function HrJobReadyRow({ job }: Props) {
  const qc = useQueryClient();

  const publishMut = useMutation({
    mutationFn: () => api.post(`/jobs/${job.id}/publish`),
    onSuccess: () => {
      invalidateHrJobsQueries(qc);
      qc.invalidateQueries({ queryKey: queryKeys.jobs.listOpen });
    },
  });

  return (
    <li className="rounded-md border border-mint/30 bg-mint-light/40 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-medium text-slate-900">{job.title}</span>
            <span className="rounded-full bg-mint-light px-2 py-0.5 text-xs font-medium text-navy">
              Ready to publish
            </span>
          </div>
          <AssessmentPlanSummary job={job} variant="card" className="mt-2" />
          <AssessmentPlanSectionsList job={job} numbered className="mt-3" />
          <p className="mt-2 text-xs text-slate-500">
            Evaluator submitted the assessment plan. Publishing starts question-bank prep and
            opens the job to candidates.
          </p>
          {publishMut.isError && (
            <p className="mt-2 text-xs font-medium text-red-700" role="alert">
              {getApiErrorMessage(publishMut.error, 'Could not publish job.')}
            </p>
          )}
        </div>
        <button
          type="button"
          className="btn-primary btn-sm shrink-0"
          disabled={publishMut.isPending}
          onClick={() => publishMut.mutate()}
        >
          {publishMut.isPending ? 'Publishing…' : 'Publish job'}
        </button>
      </div>
    </li>
  );
}
