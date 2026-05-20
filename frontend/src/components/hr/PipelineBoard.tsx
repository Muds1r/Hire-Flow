import type { Application } from '../../types';
import {
  groupApplicationsByStage,
  PIPELINE_STAGES,
  type PipelineStageId,
} from '../../utils/pipelineStage';
import { PipelineCard } from './PipelineCard';

type Props = {
  applications: Application[];
};

export function PipelineBoard({ applications }: Props) {
  const grouped = groupApplicationsByStage(applications);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-full gap-4">
        {PIPELINE_STAGES.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stageId={stage.id}
            title={stage.title}
            hint={stage.hint}
            applications={grouped[stage.id]}
          />
        ))}
      </div>
    </div>
  );
}

function PipelineColumn({
  stageId,
  title,
  hint,
  applications,
}: {
  stageId: PipelineStageId;
  title: string;
  hint: string;
  applications: Application[];
}) {
  return (
    <section
      className="flex w-[min(100%,20rem)] flex-1 shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-slate-50/80 min-w-[14rem]"
      aria-labelledby={`pipeline-col-${stageId}`}
    >
      <header className="border-b border-slate-200/80 px-3 py-3">
        <h3 id={`pipeline-col-${stageId}`} className="text-sm font-bold text-slate-900">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
        <p className="mt-1 text-xs font-semibold text-navy">
          {applications.length} candidate{applications.length === 1 ? '' : 's'}
        </p>
      </header>
      <ul className="flex max-h-[min(70vh,32rem)] flex-col gap-2 overflow-y-auto p-2">
        {applications.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-200 px-2 py-6 text-center text-xs text-slate-400">
            Empty
          </li>
        ) : (
          applications.map((app) => (
            <li key={app.id}>
              <PipelineCard application={app} />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
