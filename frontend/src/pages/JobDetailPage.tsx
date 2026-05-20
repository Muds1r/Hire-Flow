import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, getApiErrorMessage } from '../services/http';
import { LoadingState } from '../components/LoadingState';
import { useAuthStore } from '../store/authStore';
import { queryKeys } from '../hooks/queryKeys';
import { useJobDetail } from '../features/jobs/hooks';
import { invalidateHrJobsQueries } from '../features/jobs/invalidateHrJobs';
import { invalidateHrApplicationCaches } from '../features/applications/hooks';

const schema = z.object({
  file: z
    .custom<FileList>((v) => v instanceof FileList && v.length > 0, {
      message: 'Choose a CV file',
    }),
});

type Form = z.infer<typeof schema>;

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const jobQuery = useJobDetail(id);

  const isHrOwner =
    user?.role === 'HR' && !!jobQuery.data?.createdById && user.id === jobQuery.data.createdById;
  const showApply =
    (!user || user.role === 'CANDIDATE') &&
    jobQuery.data &&
    !jobQuery.data.closedAt &&
    !!jobQuery.data.publishedAt;

  const closeJobMut = useMutation({
    mutationFn: () => api.post(`/jobs/${id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.jobs.listOpen });
      invalidateHrJobsQueries(qc);
      invalidateHrApplicationCaches(qc, id);
      qc.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) });
      navigate('/hr');
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('jobId', id!);
      form.append('cv', file);
      return api.post('/applications', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.applications.list });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  if (jobQuery.isLoading) return <LoadingState message="Loading job…" />;
  if (jobQuery.error || !jobQuery.data) {
    return (
      <div className="app-card border-red-200 bg-red-50/50 text-red-800">
        <p className="font-medium">Job not found or this listing is no longer available.</p>
        <Link className="link-muted mt-3 inline-block" to="/jobs">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  const job = jobQuery.data;
  const isClosed = job.closedAt != null;

  return (
    <div>
      <Link
        to={isHrOwner && isClosed ? '/hr' : '/jobs'}
        className="link-muted inline-flex items-center gap-1 rounded-lg py-1"
      >
        <span aria-hidden>←</span>
        {isHrOwner && isClosed ? 'HR desk' : 'All jobs'}
      </Link>

      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="page-title">{job.title}</h1>
          <p className="page-subtitle mt-2">Job description and how to apply.</p>
        </div>
        {isHrOwner && !isClosed && (
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end sm:pt-1">
            <button
              type="button"
              className="btn-secondary border-slate-300 text-slate-800 hover:bg-slate-100 sm:min-w-[9rem]"
              disabled={closeJobMut.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    'Close this job? Candidates and evaluators will no longer see it. You can still view applicants and results from HR.',
                  )
                ) {
                  return;
                }
                closeJobMut.mutate();
              }}
            >
              {closeJobMut.isPending ? 'Closing…' : 'Close job'}
            </button>
            {closeJobMut.isError && (
              <p className="max-w-xs text-right text-xs font-medium text-red-700" role="alert">
                {getApiErrorMessage(closeJobMut.error, 'Could not close job.')}
              </p>
            )}
          </div>
        )}
      </header>

      {isClosed && isHrOwner && (
        <div className="app-card mt-6 border-amber-200 bg-amber-50/80 text-amber-950">
          <p className="text-sm font-semibold">This listing is closed</p>
          <p className="mt-1 text-sm text-amber-900/90">
            It is hidden from candidates and evaluators. Applicants and results are on your closed-job
            page.
          </p>
          <Link className="btn-secondary mt-4 inline-block text-center" to={`/hr/jobs/${job.id}`}>
            View applicants &amp; results
          </Link>
        </div>
      )}

      <article className="app-card mt-6 whitespace-pre-wrap text-left text-sm leading-relaxed text-slate-700">
        {job.description}
      </article>

      {showApply ? (
        <section className="app-card mt-8">
          <h2 className="text-lg font-bold text-slate-900">Apply</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload a <strong>PDF</strong> or <strong>DOCX</strong> résumé. We extract text and run
            matching when your API key is configured.
          </p>
          <form
            className="mt-5 flex flex-col gap-4"
            onSubmit={handleSubmit((vals) => {
              const f = vals.file[0];
              applyMutation.mutate(f);
            })}
          >
            <div>
              <label className="app-label">CV file</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="mt-2 block w-full cursor-pointer text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-mint-light file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy hover:file:bg-mint-light"
                {...register('file')}
              />
              {errors.file && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {errors.file.message as string}
                </p>
              )}
            </div>
            {applyMutation.isError && (
              <p
                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200/80"
                role="alert"
              >
                Apply failed — this job may be closed or you may have already applied.
              </p>
            )}
            {applyMutation.isSuccess && (
              <p
                className="rounded-lg bg-mint-light px-3 py-2 text-sm font-medium text-navy ring-1 ring-mint/40/80"
                role="status"
              >
                Application submitted. CV and job matching may finish in the background; open{' '}
                <strong>My applications</strong> to watch status and AI progress.
              </p>
            )}
            <button
              type="submit"
              disabled={applyMutation.isPending}
              className="btn-primary w-fit"
            >
              {applyMutation.isPending ? 'Uploading…' : 'Submit application'}
            </button>
          </form>
        </section>
      ) : (
        !isClosed &&
        user?.role === 'EVALUATOR' && (
          <section className="app-card mt-8">
            <h2 className="text-lg font-bold text-slate-900">Applications</h2>
            <p className="mt-1 text-sm text-slate-600">
              Candidates apply from this page. Use the evaluator queue to review packages HR sends you.
            </p>
          </section>
        )
      )}
    </div>
  );
}
