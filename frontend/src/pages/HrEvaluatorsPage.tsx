import { useMemo, useState } from 'react';
import { QueryPanel } from '../components/ui/QueryPanel';
import { CollapsedSection } from '../components/ui/CollapsedSection';
import { EvaluatorFormModal } from '../components/hr/EvaluatorFormModal';
import { EvaluatorListRow } from '../components/hr/EvaluatorListRow';
import { useHrEvaluatorMutations, useHrEvaluators } from '../features/evaluators/hooks';
import type { HrEvaluator } from '../types/evaluator';
import { getApiErrorMessage } from '../services/http';

export function HrEvaluatorsPage() {
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<HrEvaluator | null>(null);

  const listQuery = useHrEvaluators();
  const { create, update, deactivate, reactivate } = useHrEvaluatorMutations();

  const evaluators = listQuery.data ?? [];
  const { active, deactivated } = useMemo(() => {
    const activeList: HrEvaluator[] = [];
    const deactivatedList: HrEvaluator[] = [];
    for (const ev of evaluators) {
      if (ev.isActive) {
        activeList.push(ev);
      } else {
        deactivatedList.push(ev);
      }
    }
    return { active: activeList, deactivated: deactivatedList };
  }, [evaluators]);

  const pendingError =
    create.error ?? update.error ?? deactivate.error ?? reactivate.error;
  const isSubmitting =
    create.isPending || update.isPending || deactivate.isPending || reactivate.isPending;

  function openCreate() {
    setEditing(null);
    setModal('create');
    create.reset();
    update.reset();
  }

  function openEdit(ev: HrEvaluator) {
    setEditing(ev);
    setModal('edit');
    create.reset();
    update.reset();
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }
    setModal(null);
    setEditing(null);
    create.reset();
    update.reset();
  }

  return (
    <div className="space-y-8">
      <section className="app-card border-mint/25 bg-gradient-to-br from-white to-mint-light/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Assessment team</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Create evaluator accounts for assessment plans and candidate reviews. Deactivated
              users keep history on past jobs but cannot sign in or be assigned to new work.
            </p>
            <p className="mt-2 text-xs font-medium text-navy">
              {active.length} active · {evaluators.length} total
            </p>
          </div>
          <button type="button" className="btn-primary shrink-0" onClick={openCreate}>
            Add evaluator
          </button>
        </div>
      </section>

      <QueryPanel
        isLoading={listQuery.isLoading}
        isError={!!listQuery.error}
        loadingMessage="Loading evaluators…"
        errorMessage="Could not load evaluators."
        errorDetail={
          listQuery.error
            ? getApiErrorMessage(listQuery.error, 'Request failed.')
            : undefined
        }
      >
        <section className="app-card">
          <h3 className="text-sm font-bold uppercase tracking-wide text-navy">
            Active evaluators
          </h3>

          {active.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No active evaluators. Add one to assign jobs and reviews.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {active.map((ev) => (
                <EvaluatorListRow
                  key={ev.id}
                  evaluator={ev}
                  variant="active"
                  onEdit={() => openEdit(ev)}
                  onDeactivate={() => deactivate.mutate(ev.id)}
                  deactivatePending={deactivate.isPending}
                />
              ))}
            </ul>
          )}
        </section>

        {deactivated.length > 0 && (
          <CollapsedSection
            title="Deactivated evaluators"
            description="Former team members. Reactivate to restore sign-in and assignment."
            defaultOpen={false}
            tone="muted"
            badge={deactivated.length}
          >
            <ul className="space-y-3">
              {deactivated.map((ev) => (
                <EvaluatorListRow
                  key={ev.id}
                  evaluator={ev}
                  variant="deactivated"
                  onEdit={() => openEdit(ev)}
                  onReactivate={() => reactivate.mutate(ev.id)}
                  reactivatePending={reactivate.isPending}
                />
              ))}
            </ul>
          </CollapsedSection>
        )}
      </QueryPanel>

      <EvaluatorFormModal
        mode={modal === 'edit' ? 'edit' : 'create'}
        open={modal !== null}
        evaluator={editing}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        error={pendingError}
        onCreate={(data) => {
          create.mutate(
            {
              email: data.email,
              password: data.password,
              name: data.name?.trim() || undefined,
            },
            { onSuccess: () => closeModal() },
          );
        }}
        onUpdate={(data) => {
          if (!editing) {
            return;
          }
          update.mutate(
            {
              id: editing.id,
              email: data.email,
              name: data.name?.trim() || undefined,
              password: data.password?.trim() || undefined,
            },
            { onSuccess: () => closeModal() },
          );
        }}
      />
    </div>
  );
}
