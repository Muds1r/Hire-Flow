import { Link } from 'react-router-dom';
import type { Application } from '../../types';
import { resolvePipelineView } from '../../utils/pipelineStage';

type Props = {
  application: Application;
};

export function PipelineCard({ application }: Props) {
  const candidate = application.candidate;
  const { stageLabel, labels, nextAction } = resolvePipelineView(application);
  const extraLabels = labels.filter((l) => l !== stageLabel);

  return (
    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100 transition hover:border-mint hover:shadow-md">
      <p className="truncate text-sm font-semibold text-slate-900">
        {candidate?.name || candidate?.email || 'Candidate'}
      </p>
      {candidate?.name && candidate?.email && (
        <p className="mt-0.5 truncate text-xs text-slate-500">{candidate.email}</p>
      )}
      <p className="mt-2 inline-flex rounded-md bg-mint-light px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-navy ring-1 ring-mint/30">
        {stageLabel}
      </p>
      {extraLabels.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-1">
          {extraLabels.map((label) => (
            <li
              key={label}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
            >
              {label}
            </li>
          ))}
        </ul>
      )}
      {nextAction && (
        <p className="mt-2 text-xs font-medium text-navy">{nextAction}</p>
      )}
      <Link
        className="btn-secondary btn-sm mt-3 w-full text-center"
        to={`/hr/applications/${application.id}`}
      >
        Open
      </Link>
    </article>
  );
}
