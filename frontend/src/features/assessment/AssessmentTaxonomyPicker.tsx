import { useMemo, useState } from 'react';
import {
  ASSESSMENT_TAXONOMY,
  MAX_ASSESSMENT_SECTIONS,
  type TaxonomyDomain,
} from '../../constants/assessmentTaxonomy';
import { AssessmentPlanProgress } from '../../components/assessment/AssessmentPlanProgress';
import { AssessmentPlanSelectedStrip } from '../../components/assessment/AssessmentPlanSelectedStrip';

type Props = {
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
};

function matchesQuery(domain: TaxonomyDomain, query: string): boolean {
  const q = query.toLowerCase();
  if (domain.label.toLowerCase().includes(q)) {
    return true;
  }
  if (domain.description?.toLowerCase().includes(q)) {
    return true;
  }
  return domain.groups.some(
    (g) =>
      g.label.toLowerCase().includes(q) ||
      g.skills.some((s) => s.label.toLowerCase().includes(q)),
  );
}

function selectedCountByDomain(selected: Set<string>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const domain of ASSESSMENT_TAXONOMY) {
    let n = 0;
    for (const group of domain.groups) {
      for (const skill of group.skills) {
        if (selected.has(skill.label)) {
          n += 1;
        }
      }
    }
    if (n > 0) {
      counts.set(domain.id, n);
    }
  }
  return counts;
}

export function AssessmentTaxonomyPicker({ selected, onSelectedChange }: Props) {
  const [search, setSearch] = useState('');
  const [openDomains, setOpenDomains] = useState<Set<string>>(() => new Set());

  const selectedList = useMemo(() => [...selected], [selected]);
  const searchTrimmed = search.trim();
  const atLimit = selected.size >= MAX_ASSESSMENT_SECTIONS;

  const filteredDomains = useMemo(() => {
    if (!searchTrimmed) {
      return ASSESSMENT_TAXONOMY;
    }
    return ASSESSMENT_TAXONOMY.filter((d) => matchesQuery(d, searchTrimmed));
  }, [searchTrimmed]);

  const domainSelectedCounts = useMemo(
    () => selectedCountByDomain(selected),
    [selected],
  );

  const toggleSkill = (label: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) {
      if (next.size >= MAX_ASSESSMENT_SECTIONS) {
        return;
      }
      next.add(label);
    } else {
      next.delete(label);
    }
    onSelectedChange(next);
  };

  const toggleDomain = (domainId: string) => {
    setOpenDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  };

  const clearAll = () => onSelectedChange(new Set());

  return (
    <div>
      <div>
        <label className="app-label">
          Search skills
          <input
            type="search"
            className="app-input mt-1"
            placeholder="Search 400+ skills — e.g. React, PostgreSQL, Kubernetes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {searchTrimmed ? (
          <p className="mt-1.5 text-xs text-slate-500">
            {filteredDomains.length} domain{filteredDomains.length === 1 ? '' : 's'} match
            {filteredDomains.length === 0 ? (
              <>
                {' · '}
                <button
                  type="button"
                  className="font-semibold text-navy underline-offset-2 hover:underline"
                  onClick={() => setSearch('')}
                >
                  Clear search
                </button>
              </>
            ) : null}
          </p>
        ) : null}

        <div className="mt-3">
          <AssessmentPlanProgress selectedCount={selected.size} />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {filteredDomains.map((domain) => {
          const domainOpen = openDomains.has(domain.id) || searchTrimmed.length > 0;
          const domainCount = domainSelectedCounts.get(domain.id) ?? 0;
          return (
            <details
              key={domain.id}
              open={domainOpen}
              className="rounded-xl border border-slate-200 bg-slate-50/40"
            >
              <summary
                className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden"
                onClick={(e) => {
                  if (!searchTrimmed) {
                    e.preventDefault();
                    toggleDomain(domain.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {domain.label}
                      {domainCount > 0 ? (
                        <span className="ml-2 font-semibold text-mint-dark">
                          · {domainCount} selected
                        </span>
                      ) : null}
                    </p>
                    {domain.description ? (
                      <p className="mt-0.5 text-xs text-slate-600">{domain.description}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-400">
                    {domainOpen ? '−' : '+'}
                  </span>
                </div>
              </summary>

              <div className="space-y-3 border-t border-slate-200/80 px-4 py-3">
                {domain.groups.map((grp) => (
                  <div key={grp.id}>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {grp.label}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {grp.skills.map((skill) => {
                        const checked = selected.has(skill.label);
                        const disabled = !checked && atLimit;
                        return (
                          <li key={`${grp.id}-${skill.label}`}>
                            <label
                              title={
                                disabled ? `Maximum ${MAX_ASSESSMENT_SECTIONS} sections` : undefined
                              }
                              className={[
                                'inline-flex cursor-pointer rounded-lg border px-2.5 py-1.5 text-sm transition',
                                checked
                                  ? 'border-mint bg-mint-light font-medium text-navy ring-1 ring-mint/40'
                                  : disabled
                                    ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
                                    : 'border-slate-200 bg-white text-slate-800 hover:border-mint/50 hover:bg-white',
                              ].join(' ')}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                disabled={disabled}
                                onChange={(e) =>
                                  toggleSkill(skill.label, e.target.checked)
                                }
                              />
                              {skill.label}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>

      {filteredDomains.length === 0 && searchTrimmed ? (
        <p className="mt-3 text-sm text-slate-500">
          No skills match your search.{' '}
          <button
            type="button"
            className="font-semibold text-navy underline-offset-2 hover:underline"
            onClick={() => setSearch('')}
          >
            Clear search
          </button>
        </p>
      ) : null}

      {selectedList.length > 0 ? (
        <div className="mt-4">
          <AssessmentPlanSelectedStrip
            selected={selectedList}
            onRemove={(label) => toggleSkill(label, false)}
            onClearAll={clearAll}
          />
        </div>
      ) : null}
    </div>
  );
}
