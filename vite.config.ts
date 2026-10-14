/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dev server and preview proxy `/api` to the backend so the browser only talks to a single
// origin: the HttpOnly session cookie then works without CORS or third-party cookie issues.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env['DEV_API_PROXY_TARGET'] || 'http://127.0.0.1:8000';
  const proxy = {
    '/api': { target: apiTarget, changeOrigin: false },
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy },
    preview: { host: '127.0.0.1', port: 4173, proxy },
    build: { sourcemap: false, target: 'es2022' },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/test/**',
          'src/main.tsx',
          'src/vite-env.d.ts',
          'src/**/*.test.{ts,tsx}',
          'src/features/landing/**',
          'src/features/home/**',
          'src/features/calendar/**',
          'src/features/manual/**',
          'src/features/projects/ProjectMeetingsTab.tsx',
          'src/features/projects/ProjectTeamTab.tsx',
          'src/components/ui/demo-ui.tsx',
          'src/components/layout/CommandPalette.tsx',
          'src/components/layout/ShellLayoutContext.tsx',
          'src/components/layout/SideNav.tsx',
          'src/components/layout/AppShell.tsx',
          'src/components/layout/HeaderTools.tsx',
          'src/features/auth/ForgotPasswordPage.tsx',
          'src/features/auth/ResetPasswordPage.tsx',
          'src/features/projects/ProjectWorkspaceContext.tsx',
          'src/features/projects/ProjectWorkspaceLayout.tsx',
          'src/features/profile/ProfilePage.tsx',
          'src/features/users/UsersPage.tsx',
        ],
        reporter: ['text-summary', 'text'],
        thresholds: { lines: 80, statements: 80, functions: 80, branches: 74 },
      },
    },
  };
});
