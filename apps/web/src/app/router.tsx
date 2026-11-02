import { Navigate, Route, Routes } from 'react-router-dom';
import { ResultsPage } from '../features/assessments/pages/ResultsPage';
import { SetupPage } from '../features/assessments/pages/SetupPage';
import { TakePage } from '../features/assessments/pages/TakePage';
import { AppShell } from '../features/auth/components/AppShell';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { HomePage } from '../features/home/pages/HomePage';
import { WorkspacePage } from '../features/home/pages/WorkspacePage';
import { InterviewResultsPage } from '../features/interview/pages/InterviewResultsPage';
import { InterviewSessionPage } from '../features/interview/pages/InterviewSessionPage';
import { InterviewSetupPage } from '../features/interview/pages/InterviewSetupPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<WorkspacePage />} />
        <Route path="assessments" element={<SetupPage />} />
        <Route path="assessments/:attemptId" element={<TakePage />} />
        <Route
          path="assessments/:attemptId/results"
          element={<ResultsPage />}
        />
        <Route path="interviews" element={<InterviewSetupPage />} />
        <Route path="interviews/:sessionId" element={<InterviewSessionPage />} />
        <Route
          path="interviews/:sessionId/results"
          element={<InterviewResultsPage />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
