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
const InvitationPage = lazy(() => import('@/features/auth/InvitationPage'));
const MyTasksPage = lazy(() => import('@/features/backlog/MyTasksPage'));
const HomePage = lazy(() => import('@/features/home/HomePage'));
const UsersPage = lazy(() => import('@/features/users/UsersPage'));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));
const PermissionsPage = lazy(() => import('@/features/permissions/PermissionsPage'));
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage'));
const ProjectWorkspaceLayout = lazy(() => import('@/features/projects/ProjectWorkspaceLayout'));
const ProjectSummaryTab = lazy(() => import('@/features/projects/ProjectDetailPage'));
const ProjectModulePlaceholder = lazy(() => import('@/features/projects/ProjectModulePlaceholder'));
const AvailabilityPage = lazy(() => import('@/features/availability/AvailabilityPage'));
const MeetingsPage = lazy(() => import('@/features/meetings/MeetingsPage'));
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage'));
const UserManualPage = lazy(() => import('@/features/manual/UserManualPage'));
const ProjectMeetingsTab = lazy(() => import('@/features/projects/ProjectMeetingsTab'));
const ProjectTeamTab = lazy(() => import('@/features/projects/ProjectTeamTab'));
const ProjectBacklogTab = lazy(() => import('@/features/backlog/ProjectBacklogTab'));
const UserStoryReaderPage = lazy(() => import('@/features/backlog/UserStoryReaderPage'));
const ProjectSprintsTab = lazy(() => import('@/features/sprints/ProjectSprintsTab'));

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
                <Route path={PATHS.invitation} element={<InvitationPage />} />

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
                    <Route path={PATHS.userManual} element={<UserManualPage />} />
                    <Route path={PATHS.myTasks} element={<MyTasksPage />} />
                    <Route element={<RequireRole allow={['manager', 'developer']} />}>
                      <Route path={PATHS.projects} element={<ProjectsPage />} />
                      <Route path={PATHS.availability} element={<AvailabilityPage />} />
                      <Route path={PATHS.meetings} element={<MeetingsPage />} />
                      <Route path={PATHS.calendar} element={<CalendarPage />} />
                      <Route
                        path={`${PATHS.projects}/:projectId`}
                        element={<ProjectWorkspaceLayout />}
                      >
                        <Route index element={<ProjectSummaryTab />} />
                        <Route path="resumen" element={<ProjectSummaryTab />} />
                        <Route path="equipo" element={<ProjectTeamTab />} />
                        <Route path="reuniones" element={<ProjectMeetingsTab />} />
                        <Route path="backlog" element={<ProjectBacklogTab />} />
                        <Route path="backlog/leer" element={<UserStoryReaderPage />} />
                        <Route path="backlog/leer/:storyId" element={<UserStoryReaderPage />} />
                        <Route path="sprints" element={<ProjectSprintsTab />} />
                        <Route path=":moduleTab" element={<ProjectModulePlaceholder />} />
                      </Route>
                    </Route>
                    <Route element={<RequireRole allow="admin" />}>
                      <Route path={PATHS.homeAdmin} element={<HomePage />} />
                    </Route>
                    <Route element={<RequireRole allow={['admin', 'manager']} />}>
                      <Route path={PATHS.users} element={<UsersPage />} />
                    </Route>
                    <Route element={<RequireRole allow="manager" />}>
                      <Route path={PATHS.homeManager} element={<HomePage />} />
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
