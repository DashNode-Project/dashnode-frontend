import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { LoadFailureBoundary } from '@/components/LoadFailureBoundary';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { FlashProvider } from './FlashContext';
import { PATHS } from './paths';

const LandingPage = lazy(() => import('@/features/landing/LandingPage'));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'));

function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <span className="text-sm text-[#9CA3AF]">Cargando…</span>
    </div>
  );
}

export function AppRoutes() {
  return (
    <FlashProvider>
      <LoadFailureBoundary>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path={PATHS.landing} element={<LandingPage />} />
            <Route path={PATHS.register} element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </LoadFailureBoundary>
    </FlashProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
