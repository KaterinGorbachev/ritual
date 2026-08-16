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
  // Pre-bundling zustand separately gives it its own React reference, which is
  // null in the browser project's worker — `useStore` then blows up on
  // React.useCallback. Excluding it makes zustand resolve the same React the
  // app does. (Harmless for the jsdom project.)
  optimizeDeps: {
    exclude: ['zustand'],
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
        // Dictionaries (and anything else importing `server-only`) are Server
        // Component modules, and `server-only`'s default build throws on
        // import. On a real server Next resolves it through the "react-server"
        // condition to an empty module; here it is aliased straight to that
        // same empty build.
        //
        // An alias, not `resolve.conditions: ['react-server']` — that condition
        // is global, so it would also swap React itself for its RSC build,
        // which has no renderToStaticMarkup and fails on import.
        resolve: {
          alias: {
            'server-only': fileURLToPath(
              new URL('./node_modules/server-only/empty.js', import.meta.url),
            ),
          },
        },
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
