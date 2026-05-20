import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { api, getApiErrorMessage } from '../services/http';
import { AssignEvaluatorsModal } from '../components/AssignEvaluatorsModal';
import { ListSkeleton } from '../components/ui/ListSkeleton';
import { useHrBoard } from '../features/jobs/hooks';
import { invalidateHrJobsQueries } from '../features/jobs/invalidateHrJobs';
import { ClosedJobsSection } from '../components/hr/ClosedJobsSection';
import { PublishedJobsPanel } from '../components/hr/PublishedJobsPanel';
import { HrJobListRow } from '../features/jobs/HrJobListRow';
import { HrJobReadyRow } from '../features/jobs/HrJobReadyRow';

const jobSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
});

type JobForm = z.infer<typeof jobSchema>;

export function HrJobsPage() {
  const qc = useQueryClient();
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [pendingJob, setPendingJob] = useState<{ title: string; description: string } | null>(null);

  const boardQuery = useHrBoard();

  const createJob = useMutation({
    mutationFn: (data: { title: string; description: string; evaluatorIds: string[] }) =>
      api.post('/jobs', data),
    onSuccess: () => {
      invalidateHrJobsQueries(qc);
      setEvalModalOpen(false);
      setPendingJob(null);
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobForm>({ resolver: zodResolver(jobSchema) });

  const pendingEvaluator = boardQuery.data?.pendingEvaluator ?? [];
  const readyToPublish = boardQuery.data?.readyToPublish ?? [];

  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="app-card">
          <h2 className="text-lg font-bold text-slate-900">Create a job</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter the title and JD, then assign evaluators. The first evaluator to submit the
            assessment plan wins; you publish when ready.
          </p>
          <form
            className="mt-5 space-y-4"
            onSubmit={handleSubmit((data) => {
              setPendingJob({ title: data.title, description: data.description });
              setEvalModalOpen(true);
            })}
          >
            <label className="app-label">
              Title
              <input
                className="app-input"
                placeholder="Senior frontend engineer"
                {...register('title')}
              />
              {errors.title && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {errors.title.message}
                </span>
              )}
            </label>
            <label className="app-label">
              Job description (JD)
              <textarea
                className="app-input min-h-[140px] resize-y"
                placeholder="Role, stack, responsibilities, seniority…"
                {...register('description')}
              />
              {errors.description && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {errors.description.message}
                </span>
              )}
            </label>
            <button type="submit" className="btn-primary">
              Continue to evaluators…
            </button>
          </form>
          {createJob.isError && (
            <p className="mt-3 text-sm font-medium text-red-700" role="alert">
              {getApiErrorMessage(createJob.error, 'Could not create job draft.')}
            </p>
          )}
        </div>

        <PublishedJobsPanel />
      </section>

      {readyToPublish.length > 0 && (
        <section className="app-card border-mint/30">
          <h2 className="text-lg font-bold text-slate-900">Ready to publish</h2>
          <p className="mt-1 text-sm text-slate-600">
            Evaluator submitted the test plan. Publish to start question-bank generation and open
            applications.
          </p>
          <ul className="mt-4 space-y-2 text-left text-sm">
            {readyToPublish.map((j) => (
              <HrJobReadyRow key={j.id} job={j} />
            ))}
          </ul>
        </section>
      )}

      <section className="app-card">
        <h2 className="text-lg font-bold text-slate-900">Awaiting evaluator</h2>
        <p className="mt-1 text-sm text-slate-600">Draft JDs waiting for assessment plan from evaluator.</p>
        {boardQuery.isLoading && <ListSkeleton rows={2} />}
        {!boardQuery.isLoading && (
          <ul className="mt-4 space-y-2 text-left text-sm">
            {pendingEvaluator.map((j) => (
              <HrJobListRow key={j.id} job={j} />
            ))}
            {pendingEvaluator.length === 0 && (
              <li className="text-slate-500">No drafts waiting on evaluators.</li>
            )}
          </ul>
        )}
      </section>

      <ClosedJobsSection />

      <AssignEvaluatorsModal
        open={evalModalOpen}
        jobTitle={pendingJob?.title ?? 'New job'}
        isSubmitting={createJob.isPending}
        onClose={() => {
          if (!createJob.isPending) {
            setEvalModalOpen(false);
          }
        }}
        onConfirm={(evaluatorIds) => {
          if (!pendingJob) {
            return;
          }
          createJob.mutate({
            title: pendingJob.title,
            description: pendingJob.description,
            evaluatorIds,
          });
        }}
      />
    </div>
  );
}
