import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { LoadFailureBoundary } from '@/components/LoadFailureBoundary';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/features/auth/AuthContext';
import { GuestOnly, RequireAuth, RequireRole } from '@/features/auth/guards';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { FlashProvider } from './FlashContext';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import { UnderDevelopmentBridge } from './UnderDevelopmentBridge';
import { PATHS } from './paths';

const LandingPage = lazy(() => import('@/features/landing/LandingPage'));
const AboutPage = lazy(() => import('@/features/landing/AboutPage'));
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage'));
const SetPasswordPage = lazy(() => import('@/features/auth/SetPasswordPage'));
const HomePage = lazy(() => import('@/features/home/HomePage'));
const UsersPage = lazy(() => import('@/features/users/UsersPage'));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));
const PermissionsPage = lazy(() => import('@/features/permissions/PermissionsPage'));
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/features/projects/ProjectDetailPage'));

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
      <ToastProvider>
        <AuthProvider>
          <UnderDevelopmentBridge />
          <LoadFailureBoundary>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path={PATHS.landing} element={<LandingPage />} />
                <Route path={PATHS.about} element={<AboutPage />} />

                <Route element={<GuestOnly />}>
                  <Route path={PATHS.login} element={<LoginPage />} />
                  <Route path={PATHS.register} element={<RegisterPage />} />
                  <Route path={PATHS.forgotPassword} element={<ForgotPasswordPage />} />
                  <Route path={PATHS.setPassword} element={<SetPasswordPage />} />
                </Route>

                <Route element={<RequireAuth />}>
                  <Route element={<AppShell />}>
                    <Route path={PATHS.profile} element={<ProfilePage />} />
                    <Route path={PATHS.permissions} element={<PermissionsPage />} />
                    <Route path={PATHS.projects} element={<ProjectsPage />} />
                    <Route path={`${PATHS.projects}/:projectId`} element={<ProjectDetailPage />} />
                    <Route element={<RequireRole allow="admin" />}>
                      <Route path={PATHS.homeAdmin} element={<HomePage />} />
                      <Route path={PATHS.users} element={<UsersPage />} />
                    </Route>
                    <Route element={<RequireRole allow="manager" />}>
                      <Route path={PATHS.homeManager} element={<HomePage />} />
                      <Route path={PATHS.users} element={<UsersPage />} />
                    </Route>
                    <Route element={<RequireRole allow="developer" />}>
                      <Route path={PATHS.homeDeveloper} element={<HomePage />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </LoadFailureBoundary>
        </AuthProvider>
      </ToastProvider>
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
