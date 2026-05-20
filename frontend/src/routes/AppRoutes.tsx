import { createRoutesFromElements, Navigate, Route, useParams } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { HrLayout } from '../layouts/HrLayout';
import { EvalLayout } from '../layouts/EvalLayout';
import { GuestLayout, RequireRole } from './route-guards';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { JobsPage } from '../pages/JobsPage';
import { ApplicationsPage } from '../pages/ApplicationsPage';
import {
  LazyEvalConfigureJobPage,
  LazyEvalPortalPage,
  LazyHrApplicationPage,
  LazyHrClosedJobPage,
  LazyHrEvaluatorsPage,
  LazyHrJobsPage,
  LazyHrPipelinePage,
  LazyJobDetailPage,
  LazyTestResultPage,
  LazyTestTakePage,
} from './lazyPages';

function EvalPublishRouteRedirect() {
  const { jobId } = useParams<{ jobId: string }>();
  return <Navigate to={`/eval/jobs/${jobId}/configure`} replace />;
}

/** `RouteObject[]` for `createBrowserRouter` — data router enables `useBlocker` on `TestTakePage`. */
export const appRoutes = createRoutesFromElements(
  <>
    <Route
      path="/login"
      element={
        <GuestLayout>
          <LoginPage />
        </GuestLayout>
      }
    />
    <Route
      path="/register"
      element={
        <GuestLayout>
          <RegisterPage />
        </GuestLayout>
      }
    />
    <Route element={<AppLayout />}>
      <Route index element={<HomePage />} />
      <Route path="jobs" element={<JobsPage />} />
      <Route path="jobs/:id" element={<LazyJobDetailPage />} />
      <Route path="applications" element={<ApplicationsPage />} />
      <Route path="tests/:testId" element={<LazyTestTakePage />} />
      <Route
        path="hr"
        element={
          <RequireRole role="HR">
            <HrLayout />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="pipeline" replace />} />
        <Route path="pipeline" element={<LazyHrPipelinePage />} />
        <Route path="evaluators" element={<LazyHrEvaluatorsPage />} />
        <Route path="applications" element={<Navigate to="/hr/pipeline" replace />} />
        <Route path="applications/:id" element={<LazyHrApplicationPage />} />
        <Route path="jobs">
          <Route index element={<LazyHrJobsPage />} />
          <Route path=":jobId" element={<LazyHrClosedJobPage />} />
        </Route>
        <Route path="tests/:testId" element={<LazyTestResultPage />} />
      </Route>
      <Route
        path="eval"
        element={
          <RequireRole role="EVALUATOR">
            <EvalLayout />
          </RequireRole>
        }
      >
        <Route index element={<LazyEvalPortalPage />} />
        <Route path="jobs/:jobId/configure" element={<LazyEvalConfigureJobPage />} />
        <Route path="jobs/:jobId/publish" element={<EvalPublishRouteRedirect />} />
        <Route path="tests/:testId" element={<LazyTestResultPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </>,
);
