import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '../services/http';
import { queryKeys } from '../hooks/queryKeys';
import { invalidateHrJobsQueries } from '../features/jobs/invalidateHrJobs';
import { PageHeader } from '../components/ui/PageHeader';
import { QueryPanel } from '../components/ui/QueryPanel';
import { AssessmentTaxonomyPicker } from '../features/assessment/AssessmentTaxonomyPicker';
import { useEvaluatorDraftJob } from '../features/jobs/hooks';
import {
  DEFAULT_TEST_INTENSITY,
  TEST_INTENSITY_OPTIONS,
  type TestIntensityLevel,
} from '../constants/testIntensity';

export function EvalConfigureJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [testIntensity, setTestIntensity] = useState<TestIntensityLevel>(
    DEFAULT_TEST_INTENSITY,
  );

  const jobQuery = useEvaluatorDraftJob(jobId);

  const submitMut = useMutation({
    mutationFn: (payload: { intensity: TestIntensityLevel; sectionTitles: string[] }) =>
      api.post(`/jobs/evaluator/${jobId}/submit-config`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.jobs.evaluatorPending });
      invalidateHrJobsQueries(qc);
      navigate('/eval', { replace: true });
    },
  });

  const job = jobQuery.data;
  const sectionTitles = [...selected];
  const planAlreadySubmitted = !!job?.evaluatorConfigSubmittedAt;

  useEffect(() => {
    if (job?.publishedAt || planAlreadySubmitted) {
      navigate('/eval', { replace: true });
    }
  }, [job?.publishedAt, planAlreadySubmitted, navigate]);

  return (
    <QueryPanel
      isLoading={jobQuery.isLoading}
      isError={jobQuery.isError || !job}
      loadingMessage="Loading job draft…"
      errorMessage="Could not load this job draft."
      backTo="/eval"
      backLabel="Back to evaluator home"
    >
      {job && !planAlreadySubmitted && (
        <div className="space-y-6">
          <PageHeader
            title={job.title}
            breadcrumb={
              <p className="text-sm text-slate-500">
                <Link className="link-muted" to="/eval">
                  Evaluator home
                </Link>{' '}
                / Configure assessment
              </p>
            }
            subtitle={
              <p className="max-w-3xl whitespace-pre-wrap">{job.description}</p>
            }
          />

          <section className="app-card">
            <h2 className="text-lg font-bold text-slate-900">Assessment plan</h2>
            <p className="mt-1 text-sm text-slate-600">
              Expand a category, pick skills to test, set one overall difficulty, then send the
              plan to HR. If several evaluators are assigned, the{' '}
              <strong>first submission is final</strong>.
            </p>

            <div className="mt-4">
              <AssessmentTaxonomyPicker selected={selected} onSelectedChange={setSelected} />
            </div>

            <div className="mt-6 rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Submit plan
              </p>
              {sectionTitles.length === 0 ? (
                <p className="mt-2 text-sm text-amber-800">
                  Pick at least one skill above, then set intensity and send to HR.
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  {sectionTitles.length} section{sectionTitles.length === 1 ? '' : 's'} ready to
                  send.
                </p>
              )}

              {submitMut.isError && (
                <p className="mt-3 text-sm font-medium text-red-700" role="alert">
                  {getApiErrorMessage(submitMut.error, 'Could not send plan to HR.')}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                <Link className="btn-secondary w-full sm:w-auto" to="/eval">
                  Cancel
                </Link>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:gap-4">
                  <label className="app-label !mb-0 w-full min-w-0 sm:min-w-[14rem]">
                    Overall test intensity
                    <select
                      className="app-input mt-1"
                      value={testIntensity}
                      onChange={(e) =>
                        setTestIntensity(e.target.value as TestIntensityLevel)
                      }
                    >
                      {TEST_INTENSITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block text-xs text-slate-500">
                      {
                        TEST_INTENSITY_OPTIONS.find((o) => o.value === testIntensity)
                          ?.hint
                      }
                    </span>
                  </label>
                  <button
                    type="button"
                    className="btn-primary w-full sm:mb-0.5 sm:w-auto"
                    disabled={submitMut.isPending || sectionTitles.length === 0}
                    onClick={() =>
                      submitMut.mutate({
                        intensity: testIntensity,
                        sectionTitles,
                      })
                    }
                  >
                    {submitMut.isPending ? 'Sending…' : 'Send to HR'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </QueryPanel>
  );
}
