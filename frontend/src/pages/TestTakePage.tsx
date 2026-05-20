import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/http';
import { QuestionStemCanvas } from '../components/QuestionStemCanvas';
import { queryKeys } from '../hooks/queryKeys';
import type { CandidateTestPayload } from '../types';
import { LoadingState } from '../components/LoadingState';
import { submitTestKeepAlive } from '../utils/submitTestOnLeave';
import { isTestAttemptInProgress } from '../utils/testAttempt';

export function TestTakePage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const dataRef = useRef<CandidateTestPayload | undefined>(undefined);
  const testIdRef = useRef<string | undefined>(undefined);
  const leaveSubmittedRef = useRef(false);

  const testQuery = useQuery({
    queryKey: queryKeys.tests.candidate(testId),
    queryFn: () =>
      api
        .get<CandidateTestPayload>(`/tests/${testId}/candidate`)
        .then((r) => r.data),
    enabled: !!testId,
    refetchInterval: (q) =>
      ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(q.state.data?.status ?? '')
        ? false
        : 30_000,
  });

  const data = testQuery.data;
  dataRef.current = data;
  testIdRef.current = testId;

  const saveMut = useMutation({
    mutationFn: (body: {
      sectionIndex: number;
      questionIndex: number;
      selectedOption?: number;
      lock?: boolean;
    }) => api.patch(`/tests/${testId}/answers`, body),
    onSuccess: () => testQuery.refetch(),
  });

  const violMut = useMutation({
    mutationFn: () => api.post(`/tests/${testId}/violations`),
    onSuccess: () => testQuery.refetch(),
  });

  const submitMut = useMutation({
    mutationFn: () => api.post(`/tests/${testId}/submit`),
    onSuccess: () => {
      leaveSubmittedRef.current = true;
      qc.invalidateQueries({ queryKey: queryKeys.applications.list });
      navigate('/applications');
    },
  });

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!testId) return false;
    const d = dataRef.current;
    if (!d || !isTestAttemptInProgress(d.status)) return false;
    if (leaveSubmittedRef.current) return false;
    return currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (leaveSubmittedRef.current) {
      blocker.proceed();
      return;
    }
    leaveSubmittedRef.current = true;
    submitTestKeepAlive(testId!)
      .catch(() => {
        leaveSubmittedRef.current = false;
      })
      .finally(() => {
        blocker.proceed();
      });
  }, [blocker.state, blocker.proceed, testId]);

  useEffect(() => {
    const onPageHide = (e: PageTransitionEvent) => {
      if (e.persisted) return;
      const tid = testIdRef.current;
      const d = dataRef.current;
      if (!tid || !d || !isTestAttemptInProgress(d.status) || leaveSubmittedRef.current) return;
      leaveSubmittedRef.current = true;
      void submitTestKeepAlive(tid);
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, []);

  const [si, setSi] = useState(0);
  const [qi, setQi] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(25);
  const tabHiddenRef = useRef(false);
  const selectedRef = useRef<number | null>(null);
  /** Prevents double timer-expiry handling (StrictMode / stale secondsLeft=0 on question change). */
  const timerExpiryHandledRef = useRef<string | null>(null);

  const qSeconds = data?.questionSeconds ?? 25;
  const currentSection = data?.sections[si];
  const currentQuestion = currentSection?.questions[qi];

  const selected =
    data?.answers.find((a) => a.sectionIndex === si && a.questionIndex === qi)
      ?.selectedOption ?? null;
  selectedRef.current = selected;

  const locked = !!data?.answers.find(
    (a) => a.sectionIndex === si && a.questionIndex === qi,
  )?.locked;

  const advance = useCallback(() => {
    if (!data) return;
    const perQ = data.questionSeconds ?? 25;
    setSecondsLeft(perQ);
    const sec = data.sections[si];
    if (qi + 1 < sec.questions.length) {
      setQi((q) => q + 1);
    } else if (si + 1 < data.sections.length) {
      setSi((s) => s + 1);
      setQi(0);
    } else {
      submitMut.mutate();
    }
  }, [data, si, qi, submitMut]);

  const progress = useMemo(() => {
    if (!data) return { current: 0, total: 1, pct: 0 };
    const total = data.sections.reduce((n, s) => n + s.questions.length, 0);
    const before = data.sections
      .slice(0, si)
      .reduce((n, s) => n + s.questions.length, 0);
    const current = before + qi + 1;
    return { current, total, pct: Math.min(100, Math.round((current / total) * 100)) };
  }, [data, si, qi]);

  useEffect(() => {
    if (!data) return;
    if (['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(data.status)) {
      navigate('/applications', { replace: true });
    }
  }, [data, navigate]);

  useEffect(() => {
    setSecondsLeft(qSeconds);
  }, [si, qi, qSeconds, data?.id]);

  useEffect(() => {
    timerExpiryHandledRef.current = null;
  }, [data?.id, si, qi]);

  useEffect(() => {
    if (!data) return;
    if (['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(data.status)) return;
    if (locked) return;

    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [data?.id, data?.status, si, qi, locked]);

  useEffect(() => {
    if (secondsLeft !== 0 || !data) return;
    if (['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(data.status)) return;
    if (locked) return;

    const key = `${data.id}-${si}-${qi}`;
    if (timerExpiryHandledRef.current === key) return;
    timerExpiryHandledRef.current = key;

    const picked = selectedRef.current;
    const body =
      picked !== null && picked !== undefined
        ? {
            sectionIndex: si,
            questionIndex: qi,
            selectedOption: picked,
            lock: true as const,
          }
        : { sectionIndex: si, questionIndex: qi, lock: true as const };

    saveMut.mutate(body, {
      onSettled: () => {
        advance();
      },
    });
  }, [secondsLeft, data, si, qi, saveMut, advance, locked]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        if (!tabHiddenRef.current) {
          tabHiddenRef.current = true;
          violMut.mutate();
        }
      } else {
        tabHiddenRef.current = false;
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [violMut]);

  if (testQuery.isLoading) return <LoadingState message="Preparing your assessment…" />;
  if (testQuery.error || !data || !currentQuestion || !currentSection) {
    return (
      <div className="app-card max-w-lg text-red-800">
        <p className="font-medium">Could not load this test.</p>
        <p className="mt-2 text-sm text-red-700/90">
          It may have been submitted already, or the link is invalid.
        </p>
      </div>
    );
  }

  const timerPct = qSeconds > 0 ? Math.min(100, (secondsLeft / qSeconds) * 100) : 0;
  const violationWarn =
    data.violationCount >= data.violationThreshold - 1 &&
    data.violationCount < data.violationThreshold;

  return (
    <div className="mx-auto max-w-2xl text-left">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Progress</span>
        <span className="tabular-nums text-slate-700">
          {progress.current} / {progress.total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-mint to-navy transition-all duration-500 ease-out"
          style={{ width: `${progress.pct}%` }}
        />
      </div>

      <header className="mt-8">
        <h1 className="page-title !text-2xl">Assessment</h1>
        <p className="page-subtitle !mt-2">
          <span className="font-semibold text-navy">{currentSection.title}</span>
          {' · '}
          Question {qi + 1} of {currentSection.questions.length}
          {' · '}
          <span className="whitespace-nowrap">Difficulty {currentQuestion.difficulty}/10</span>
        </p>
        <p className="mt-3 text-xs font-medium text-slate-500">
          Leaving this page or closing the browser submits your attempt automatically so progress is not
          lost.
        </p>
      </header>

      <div className="app-card mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Time remaining
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  secondsLeft <= 10
                    ? 'bg-gradient-to-r from-amber-500 to-red-500'
                    : 'bg-gradient-to-r from-mint to-mint'
                }`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{secondsLeft}s</p>
          </div>
          <div
            className={`rounded-xl px-4 py-3 text-sm ring-1 ${
              violationWarn
                ? 'bg-amber-50 text-amber-900 ring-amber-200'
                : 'bg-slate-50 text-slate-700 ring-slate-200/80'
            }`}
          >
            <p className="font-semibold text-slate-800">Anti-cheat</p>
            <p className="mt-1 text-xs leading-snug text-slate-600">
              Tab switches:{' '}
              <strong>
                {data.violationCount}/{data.violationThreshold}
              </strong>
              {violationWarn && (
                <span className="mt-1 block font-medium text-amber-800">
                  One more hidden tab may auto-submit.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="app-card mt-6">
        <QuestionStemCanvas text={currentQuestion.question} />
        <div className="mt-5 flex flex-col gap-2.5">
          {currentQuestion.options.map((opt, idx) => (
            <label
              key={idx}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 transition ${
                selected === idx
                  ? 'border-mint bg-mint-light/90 shadow-sm shadow-mint/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
              } ${locked ? 'pointer-events-none opacity-55' : ''}`}
            >
              <input
                type="radio"
                name="opt"
                disabled={locked}
                checked={selected === idx}
                className="mt-1 h-4 w-4 shrink-0 border-slate-300 text-mint-dark focus:ring-mint"
                onChange={() => {
                  saveMut.mutate({
                    sectionIndex: si,
                    questionIndex: qi,
                    selectedOption: idx,
                    lock: false,
                  });
                }}
              />
              <span className="text-sm font-medium leading-relaxed text-slate-800">{opt}</span>
            </label>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            disabled={locked || saveMut.isPending}
            className="btn-primary"
            onClick={() => {
              if (locked) return;
              if (selected !== null && selected !== undefined) {
                saveMut.mutate(
                  {
                    sectionIndex: si,
                    questionIndex: qi,
                    selectedOption: selected,
                    lock: true,
                  },
                  { onSettled: () => advance() },
                );
              } else {
                saveMut.mutate(
                  { sectionIndex: si, questionIndex: qi, lock: true },
                  { onSettled: () => advance() },
                );
              }
            }}
          >
            {selected === null ? 'Next (no answer)' : 'Lock answer & next'}
          </button>
          {!locked && selected === null && (
            <p className="w-full text-sm text-slate-600">
              You can skip without choosing; the timer will move on automatically when it reaches zero.
            </p>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => submitMut.mutate()}
            disabled={submitMut.isPending}
          >
            Submit entire test
          </button>
        </div>
      </div>
    </div>
  );
}
