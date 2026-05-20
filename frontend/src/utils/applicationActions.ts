import { isTestAttemptFinishedForHr } from './test-status';

/** Minimal application fields for HR action visibility. */
export type ApplicationForActions = {
  status: string;
  sentToEvaluatorsAt?: string | null;
  evaluatorAssignmentCount?: number;
};

import { QUESTIONS_REQUIRED_PER_SECTION } from '../constants/assessment';

export { QUESTIONS_REQUIRED_PER_SECTION };

export type TestForActions = {
  status: string;
  testSections?: Array<{ _count?: { questions?: number } }>;
} | null | undefined;

export type ApplicationActionsResult = {
  generateTestVisible: boolean;
  sendTestVisible: boolean;
  /** When true, show Send but keep it disabled (incomplete test). */
  sendTestDisabled: boolean;
  /** GRADED + assigned evaluators + not yet sent to evaluators. */
  sendToEvaluatorsVisible: boolean;
  showResultVisible: boolean;
  rejectVisible: boolean;
  /** GRADED but no evaluators assigned yet. */
  assignEvaluatorsHintVisible: boolean;
  evaluatorAssignmentControlsVisible: boolean;
};

const TERMINAL = new Set(['REJECTED', 'HIRED']);
const IN_FLIGHT = new Set(['TEST_SENT', 'TEST_STARTED', 'TEST_SUBMITTED']);

function isDraftLikeTest(test: TestForActions): boolean {
  return test?.status === 'DRAFT';
}

/** Every section must have exactly QUESTIONS_REQUIRED_PER_SECTION questions. */
function isHrTestSectionCountsComplete(test: TestForActions): boolean {
  const sections = test?.testSections;
  if (!sections?.length) {
    return false;
  }
  return sections.every(
    (sec) => (sec._count?.questions ?? 0) === QUESTIONS_REQUIRED_PER_SECTION,
  );
}

export function getApplicationActions(
  application: ApplicationForActions,
  test: TestForActions,
): ApplicationActionsResult {
  const s = application.status;
  const terminal = TERMINAL.has(s);
  const inFlight = IN_FLIGHT.has(s);
  const testStatus = test?.status ?? '';
  const testFinished = test ? isTestAttemptFinishedForHr(test.status) : false;

  const empty: ApplicationActionsResult = {
    generateTestVisible: false,
    sendTestVisible: false,
    sendTestDisabled: false,
    sendToEvaluatorsVisible: false,
    showResultVisible: false,
    rejectVisible: false,
    assignEvaluatorsHintVisible: false,
    evaluatorAssignmentControlsVisible: false,
  };

  if (terminal) {
    return {
      ...empty,
      showResultVisible: !!(test && testFinished),
    };
  }

  if (s === 'UNDER_REVIEW') {
    return {
      ...empty,
      showResultVisible: !!(test && testFinished),
      rejectVisible: true,
      evaluatorAssignmentControlsVisible: true,
    };
  }

  if (inFlight) {
    return { ...empty };
  }

  if (s === 'GRADED') {
    const sendEv =
      testStatus === 'GRADED' &&
      !application.sentToEvaluatorsAt &&
      (application.evaluatorAssignmentCount ?? 0) > 0;
    const hint =
      testStatus === 'GRADED' &&
      !application.sentToEvaluatorsAt &&
      (application.evaluatorAssignmentCount ?? 0) === 0;
    return {
      ...empty,
      sendToEvaluatorsVisible: sendEv,
      showResultVisible: !!(test && testFinished),
      rejectVisible: true,
      assignEvaluatorsHintVisible: hint,
      evaluatorAssignmentControlsVisible: true,
    };
  }

  if (s === 'INTERVIEW') {
    return {
      ...empty,
      showResultVisible: !!(test && testFinished),
      rejectVisible: true,
      evaluatorAssignmentControlsVisible: true,
    };
  }

  if (s === 'TEST_READY') {
    const draft = isDraftLikeTest(test);
    const sendLifecycleOk = !!(test && draft);
    const countsOk = isHrTestSectionCountsComplete(test);
    return {
      ...empty,
      generateTestVisible: true,
      sendTestVisible: sendLifecycleOk,
      sendTestDisabled: sendLifecycleOk && !countsOk,
      rejectVisible: true,
      evaluatorAssignmentControlsVisible: true,
    };
  }

  if (s === 'APPLIED' || s === 'CV_ANALYZED') {
    const draft = isDraftLikeTest(test);
    const countsOk = isHrTestSectionCountsComplete(test);
    const sendLifecycleOk = !!(test && draft);
    return {
      ...empty,
      generateTestVisible: true,
      sendTestVisible: sendLifecycleOk,
      sendTestDisabled: sendLifecycleOk && !countsOk,
      rejectVisible: true,
      evaluatorAssignmentControlsVisible: true,
    };
  }

  return {
    ...empty,
    generateTestVisible: true,
    showResultVisible: !!(test && testFinished),
    rejectVisible: true,
    evaluatorAssignmentControlsVisible: !inFlight,
  };
}
