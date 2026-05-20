import type { Application } from '../types';
import { getApplicationActions, type TestForActions } from './applicationActions';

/** Broad HR pipeline columns; sub-state shown as labels on each card. */
export type PipelineStageId = 'screening' | 'test' | 'evaluators' | 'decision';

export type PipelineStageDef = {
  id: PipelineStageId;
  title: string;
  hint: string;
};

export const PIPELINE_STAGES: PipelineStageDef[] = [
  { id: 'screening', title: 'Screening', hint: 'Applied · CV review' },
  {
    id: 'test',
    title: 'Test',
    hint: 'Setup · sent · in progress · complete',
  },
  {
    id: 'evaluators',
    title: 'Evaluators',
    hint: 'After you send to evaluators',
  },
  { id: 'decision', title: 'Decision', hint: 'Interview · finalize hiring' },
];

export type PipelineViewModel = {
  stageId: PipelineStageId;
  /** Primary sub-state label for this column. */
  stageLabel: string;
  labels: string[];
  nextAction: string | null;
};

type PipelineApplication = Pick<
  Application,
  | 'status'
  | 'aiStatus'
  | 'sentToEvaluatorsAt'
  | 'evaluatorAssignments'
> & {
  tests?: Application['tests'];
};

function latestTest(app: PipelineApplication): TestForActions | undefined {
  const t = app.tests?.[0];
  if (!t) return undefined;
  return { status: t.status, testSections: t.testSections };
}

function evaluatorReviewProgress(app: PipelineApplication): { done: number; total: number } {
  const rows = app.evaluatorAssignments ?? [];
  const total = rows.length;
  const done = rows.filter((r) => r.reviewSubmittedAt).length;
  return { done, total };
}

function resolveStageId(app: PipelineApplication): PipelineStageId {
  const s = app.status;
  const testStatus = app.tests?.[0]?.status ?? '';

  if (s === 'INTERVIEW') {
    return 'decision';
  }
  if (s === 'UNDER_REVIEW') {
    return 'evaluators';
  }
  if (
    s === 'GRADED' ||
    s === 'TEST_SUBMITTED' ||
    s === 'TEST_STARTED' ||
    s === 'TEST_SENT' ||
    s === 'TEST_READY' ||
    testStatus === 'DRAFT' ||
    testStatus === 'SENT' ||
    testStatus === 'IN_PROGRESS' ||
    testStatus === 'SUBMITTED' ||
    testStatus === 'AUTO_SUBMITTED' ||
    testStatus === 'GRADED'
  ) {
    return 'test';
  }
  return 'screening';
}

function deriveNextAction(app: PipelineApplication): string | null {
  const test = latestTest(app);
  const actions = getApplicationActions(
    {
      status: app.status,
      sentToEvaluatorsAt: app.sentToEvaluatorsAt,
      evaluatorAssignmentCount: app.evaluatorAssignments?.length ?? 0,
    },
    test,
  );
  if (actions.generateTestVisible && !actions.sendTestVisible) {
    return 'Generate test';
  }
  if (actions.sendTestVisible) {
    return actions.sendTestDisabled ? 'Complete test sections' : 'Send test';
  }
  if (actions.assignEvaluatorsHintVisible) {
    return 'Assign evaluators';
  }
  if (actions.sendToEvaluatorsVisible) {
    return 'Send to evaluators';
  }
  if (actions.showResultVisible && app.status === 'UNDER_REVIEW') {
    return 'Review result';
  }
  if (actions.rejectVisible && app.status === 'UNDER_REVIEW') {
    return 'Finalize decision';
  }
  if (actions.rejectVisible && app.status === 'INTERVIEW') {
    return 'Finalize decision';
  }
  return null;
}

function deriveScreeningLabel(app: PipelineApplication): string {
  if (app.aiStatus === 'PENDING') {
    return 'CV analyzing';
  }
  if (app.status === 'CV_ANALYZED') {
    return 'CV analyzed';
  }
  return 'Applied';
}

function deriveTestLabel(app: PipelineApplication): string {
  const s = app.status;
  const testStatus = app.tests?.[0]?.status ?? '';

  if (s === 'GRADED' || testStatus === 'GRADED') {
    return 'Test complete';
  }
  if (s === 'TEST_SUBMITTED' || testStatus === 'SUBMITTED' || testStatus === 'AUTO_SUBMITTED') {
    return 'Test submitted';
  }
  if (s === 'TEST_STARTED' || testStatus === 'IN_PROGRESS') {
    return 'In progress';
  }
  if (s === 'TEST_SENT' || testStatus === 'SENT') {
    return 'Waiting for test';
  }
  if (testStatus === 'DRAFT' || s === 'TEST_READY') {
    return 'Test setup';
  }
  return 'Test';
}

function deriveEvaluatorsLabel(app: PipelineApplication): string {
  const { done, total } = evaluatorReviewProgress(app);
  if (total === 0) {
    return 'No evaluators assigned';
  }
  if (done === 0) {
    return 'Waiting for evaluators';
  }
  if (done < total) {
    return `${done}/${total} evaluated`;
  }
  return 'Evaluated';
}

function deriveExtraLabels(app: PipelineApplication, stageId: PipelineStageId): string[] {
  const extras: string[] = [];
  if (stageId === 'screening' && app.aiStatus === 'FAILED') {
    extras.push('CV analysis failed');
  }
  if (stageId === 'test') {
    const testStatus = app.tests?.[0]?.status ?? '';
    if (testStatus === 'DRAFT') {
      extras.push('Draft test');
    }
    if (app.status === 'GRADED' && (app.evaluatorAssignments?.length ?? 0) === 0) {
      extras.push('Assign evaluators');
    }
  }
  return extras;
}

function deriveStageLabel(app: PipelineApplication, stageId: PipelineStageId): string {
  switch (stageId) {
    case 'screening':
      return deriveScreeningLabel(app);
    case 'test':
      return deriveTestLabel(app);
    case 'evaluators':
      return deriveEvaluatorsLabel(app);
    case 'decision':
      return 'Interview';
    default:
      return '';
  }
}

/** Maps an application to a pipeline column (active jobs only). */
export function resolvePipelineView(app: PipelineApplication): PipelineViewModel {
  const stageId = resolveStageId(app);
  const stageLabel = deriveStageLabel(app, stageId);
  const extras = deriveExtraLabels(app, stageId);
  const labels = extras.length > 0 ? [stageLabel, ...extras.filter((e) => e !== stageLabel)] : [stageLabel];
  const nextAction = deriveNextAction(app);

  return { stageId, stageLabel, labels, nextAction };
}

export function isPipelineTerminal(status: string): boolean {
  return status === 'REJECTED' || status === 'HIRED';
}

export function groupApplicationsByStage<T extends PipelineApplication>(
  apps: T[],
): Record<PipelineStageId, T[]> {
  const groups = Object.fromEntries(
    PIPELINE_STAGES.map((s) => [s.id, [] as T[]]),
  ) as Record<PipelineStageId, T[]>;

  for (const app of apps) {
    const { stageId } = resolvePipelineView(app);
    groups[stageId].push(app);
  }

  return groups;
}
