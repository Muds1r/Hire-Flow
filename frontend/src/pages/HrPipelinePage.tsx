import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHrPipelineApplications } from '../features/applications/hooks';
import { QueryPanel } from '../components/ui/QueryPanel';
import { useHrPublishedJobOptions } from '../features/jobs/hooks';
import { PipelineBoard } from '../components/hr/PipelineBoard';
import { CollapsedApplicationSection } from '../components/hr/CollapsedApplicationSection';
import { RejectedCandidatesSection } from '../components/hr/RejectedCandidatesSection';
import { isPipelineTerminal } from '../utils/pipelineStage';
import { getApiErrorMessage } from '../utils/apiError';

export function HrPipelinePage() {
  const [jobId, setJobId] = useState<string>('');

  const publishedQuery = useHrPublishedJobOptions();
  const activeJobs = publishedQuery.data ?? [];

  useEffect(() => {
    if (activeJobs.length === 0) {
      if (jobId) {
        setJobId('');
      }
      return;
    }
    const stillValid = activeJobs.some((j) => j.id === jobId);
    if (!jobId || !stillValid) {
      setJobId(activeJobs[0].id);
    }
  }, [activeJobs, jobId]);

  const pipelineQuery = useHrPipelineApplications(jobId);
  const selectedJob = activeJobs.find((j) => j.id === jobId);

  const { pipelineApps, hiredForJob } = useMemo(() => {
    const all = pipelineQuery.data ?? [];
    const pipeline = all.filter((a) => !isPipelineTerminal(a.status));
    const hired = all.filter((a) => a.status === 'HIRED');
    return { pipelineApps: pipeline, hiredForJob: hired };
  }, [pipelineQuery.data]);

  const pipelineLoading =
    publishedQuery.isLoading || (!!jobId && pipelineQuery.isLoading);
  const pipelineError = publishedQuery.error ?? pipelineQuery.error;

  return (
    <QueryPanel
      isLoading={pipelineLoading}
      isError={!!pipelineError}
      loadingMessage="Loading pipeline…"
      errorMessage="Could not load pipeline data."
      errorDetail={
        pipelineError
          ? getApiErrorMessage(pipelineError, 'Request failed.')
          : undefined
      }
    >
      <div className="space-y-6">
        <section className="app-card">
          <label className="app-label" htmlFor="pipeline-job-select">
            Open job
          </label>
          {activeJobs.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              No open jobs.{' '}
              <Link className="link-muted" to="/hr/jobs">
                Create or reopen a job post
              </Link>
              .
            </p>
          ) : (
            <select
              id="pipeline-job-select"
              className="app-input mt-2 max-w-xl"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              {activeJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          )}
          {selectedJob && (
            <p className="mt-3 text-sm text-slate-600">
              {pipelineApps.length} active in pipeline
              {hiredForJob.length > 0 ? ` · ${hiredForJob.length} hired` : ''}
            </p>
          )}
        </section>

        {selectedJob && (
          <section>
            <h2 className="sr-only">Pipeline board for {selectedJob.title}</h2>
            <PipelineBoard applications={pipelineApps} />
          </section>
        )}

        {selectedJob && hiredForJob.length > 0 && (
          <CollapsedApplicationSection
            title="Hired"
            description={`Hired for “${selectedJob.title}”.`}
            applications={hiredForJob}
            tone="muted"
          />
        )}

        <RejectedCandidatesSection />
      </div>
    </QueryPanel>
  );
}
