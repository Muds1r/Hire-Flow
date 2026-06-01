export type UserRole = 'CANDIDATE' | 'HR' | 'EVALUATOR';

/** API user object returned with JWT login/register */
export type AuthUser = {
  id: string;
  email: string;
  role: string;
  name?: string | null;
};

/** POST /auth/login | /auth/register — JWT is httpOnly cookie, not in body */
export type AuthSessionResponse = {
  user: AuthUser;
};

export type QuestionTierLabel = 'easy' | 'medium' | 'hard' | 'expert';

export type SectionTierCounts = Record<
  QuestionTierLabel,
  { correct: number; total: number }
>;

export type SectionPerformanceDetail = {
  correct: number;
  total: number;
  accuracy?: number;
  tiers?: SectionTierCounts;
};

export type ResultAnalytics = {
  sectionPerformance?: Record<string, SectionPerformanceDetail>;
};

export type MatchResult = {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  weakAreas: string[];
};

export type EvaluatorPost = {
  id: string;
  applicationId: string;
  evaluatorId: string;
  sectionTitle: string;
  comment: string;
  createdAt: string;
  evaluator: { id: string; email: string; name?: string | null };
};

import type { TestIntensityLevel } from '../constants/testIntensity';

export type { TestIntensityLevel };

export type JobSectionConfig = {
  title: string;
  intensity: TestIntensityLevel;
};

export type JobEvaluatorRow = {
  id: string;
  evaluator: { id: string; email: string; name?: string | null };
};

export type Job = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  createdById?: string;
  closedAt?: string | null;
  publishedAt?: string | null;
  evaluatorConfigSubmittedAt?: string | null;
  assessmentSectionTitles?: string[] | null;
  assessmentSectionConfig?: JobSectionConfig[] | null;
  assessmentBankReady?: boolean;
  assessmentBankPreparedAt?: string | null;
  assessmentBankPrepPhase?:
    | 'NOT_STARTED'
    | 'FILLING_QUESTIONS'
    | 'READY'
    | 'FAILED';
  jobEvaluators?: JobEvaluatorRow[];
  createdBy?: { id: string; name?: string | null; email: string };
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type HrJobsBoard = {
  pendingEvaluator: Job[];
  /** Evaluator submitted plan; HR must publish to go live. */
  readyToPublish: Job[];
  publishedTotal: number;
  closedTotal: number;
  /** Any published job still filling the question bank — drives board polling. */
  bankPrepInProgress: boolean;
};

export type ApplicationRejectionReason = 'JOB_CLOSED' | 'HR_MANUAL';

export type Application = {
  id: string;
  jobId: string;
  status: string;
  rejectionReason?: ApplicationRejectionReason | null;
  updatedAt?: string;
  sentToEvaluatorsAt?: string | null;
  aiStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
  cvFileKey?: string | null;
  cvMimeType?: string | null;
  matchResult?: unknown;
  job?: Job;
  candidate?: { id: string; email: string; name?: string | null };
  tests?: Array<{
    id: string;
    status: string;
    testSections?: Array<{
      orderIndex: number;
      _count: { questions: number };
    }>;
  }>;
  evaluatorAssignments?: {
    id: string;
    status: string;
    passForNextPhase?: boolean | null;
    reviewSummary?: string | null;
    reviewSubmittedAt?: string | null;
    evaluator: { id: string; email: string; name?: string | null };
  }[];
};

export type ClientQuestion = {
  id: string;
  question: string;
  options: [string, string, string, string];
  category: string;
  difficulty: number;
};

export type TestSection = {
  title: string;
  questions: ClientQuestion[];
};

export type CandidateTestPayload = {
  id: string;
  status: string;
  questionSeconds: number;
  violationCount: number;
  violationThreshold: number;
  startedAt: string | null;
  sections: TestSection[];
  answers: {
    sectionIndex: number;
    questionIndex: number;
    selectedOption: number | null;
    locked: boolean;
  }[];
};

export type HrTestSection = {
  title: string;
  questions: Array<{
    id: string;
    question: string;
    options: unknown;
    correctIndex: number;
    explanation?: string | null;
    difficulty: number;
    category: string;
    bankEntryId?: string | null;
  }>;
};

/** GET /tests/:id/hr (HR or evaluator) */
export type TestResultPayload = {
  id: string;
  status: string;
  violationCount: number;
  violationThreshold: number;
  sections?: HrTestSection[];
  result?: {
    totalScore: number;
    maxScore: number;
    aiSummary?: string | null;
    candidateSummary?: {
      strengths?: string[];
      weaknesses?: string[];
      recommendedNextStep?: string;
      sectionPerformanceSummary?: string;
      hiringRecommendation?: string;
    } | null;
    analytics?: ResultAnalytics | null;
    sectionScores?: Record<string, { correct: number; total: number }> | null;
  } | null;
  application: {
    id: string;
    status: string;
    sentToEvaluatorsAt?: string | null;
    aiStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
    evaluatorAssignmentCount?: number;
    candidate: { id: string; email: string; name?: string | null };
    job: { id: string; title: string };
  };
  /** Evaluator only — own recommendation state */
  myEvaluatorReview?: {
    passForNextPhase: boolean | null;
    reviewSummary: string | null;
    reviewSubmittedAt: string | null;
    assignmentStatus: string;
  } | null;
};
