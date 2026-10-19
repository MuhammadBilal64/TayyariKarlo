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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
