import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { playwright } from '@vitest/browser-playwright'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  // next/image reads process.env at module scope; the browser project has no
  // `process`, so importing it throws before any test runs.
  define: {
    'process.env': '{}',
  },
  test: {
    reporters: [
      'default',
      fileURLToPath(new URL('./app/test/test-log-reporter.ts', import.meta.url)),
    ],
    projects: [
      {
        // jsdom project — fast, for plain logic/smoke tests.
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          // *.db.test.tsx = component tests that mock the data layer; run in
          // jsdom (not the browser) so firebase/firestore can be mocked.
          include: ['app/test/smoke.test.tsx', 'app/test/ui/**/*.db.test.tsx'],
          setupFiles: [fileURLToPath(new URL('./app/test/setup.ts', import.meta.url))],
        },
      },
      {
        // browser project — real Chromium via Playwright, for component tests.
        extends: true,
        test: {
          name: 'browser',
          include: ['app/test/ui/**/*.test.tsx'],
          // .db.test.tsx belongs to the jsdom 'unit' project (mocks Firestore).
          exclude: ['app/test/ui/**/*.db.test.tsx'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
