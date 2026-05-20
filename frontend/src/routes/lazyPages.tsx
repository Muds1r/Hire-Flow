import { lazy, Suspense, type ComponentType } from 'react';
import { LoadingState } from '../components/LoadingState';

function lazyPage(factory: () => Promise<{ default: ComponentType }>) {
  const Lazy = lazy(factory);
  return function LazyPage() {
    return (
      <Suspense fallback={<LoadingState />}>
        <Lazy />
      </Suspense>
    );
  };
}

export const LazyJobDetailPage = lazyPage(() =>
  import('../pages/JobDetailPage').then((m) => ({ default: m.JobDetailPage })),
);
export const LazyHrPipelinePage = lazyPage(() =>
  import('../pages/HrPipelinePage').then((m) => ({ default: m.HrPipelinePage })),
);
export const LazyHrJobsPage = lazyPage(() =>
  import('../pages/HrJobsPage').then((m) => ({ default: m.HrJobsPage })),
);
export const LazyHrEvaluatorsPage = lazyPage(() =>
  import('../pages/HrEvaluatorsPage').then((m) => ({ default: m.HrEvaluatorsPage })),
);
export const LazyHrApplicationPage = lazyPage(() =>
  import('../pages/HrApplicationPage').then((m) => ({ default: m.HrApplicationPage })),
);
export const LazyHrClosedJobPage = lazyPage(() =>
  import('../pages/HrClosedJobPage').then((m) => ({ default: m.HrClosedJobPage })),
);
export const LazyTestResultPage = lazyPage(() =>
  import('../pages/TestResultPage').then((m) => ({ default: m.TestResultPage })),
);
export const LazyEvalPortalPage = lazyPage(() =>
  import('../pages/EvalPortalPage').then((m) => ({ default: m.EvalPortalPage })),
);
export const LazyEvalConfigureJobPage = lazyPage(() =>
  import('../pages/EvalConfigureJobPage').then((m) => ({ default: m.EvalConfigureJobPage })),
);
export const LazyTestTakePage = lazyPage(() =>
  import('../pages/TestTakePage').then((m) => ({ default: m.TestTakePage })),
);
