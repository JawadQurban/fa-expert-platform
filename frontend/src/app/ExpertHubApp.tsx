import { RouterProvider } from 'react-router-dom';
import { DirectionProvider, ThemeProvider } from '@ds/providers';
import { LocaleProvider } from '@i18n/LocaleProvider';
import { createExpertHubRouter } from './router/routes';
import { ExpertHubErrorBoundary } from './ExpertHubErrorBoundary';
import { readRuntimeConfig, validateRuntimeConfig } from './config/runtimeConfig';
import { deploymentProblems, expertHubConfig } from './config/expertHubConfig';

/**
 * Expert Hub **standalone application root** — the production entry composition
 * (used by `src/main.tsx`). It owns the full provider stack the
 * shared Hackathon `AppProviders` would otherwise supply, but built from
 * product-neutral pieces only (`@ds/providers`, `@i18n`) plus the Expert-Hub-owned
 * error boundary — so nothing Hackathon-specific is pulled into the standalone
 * bundle. The `AuthProvider` is mounted deeper, by `ExpertHubRootLayout`.
 *
 * On startup it validates the resolved runtime configuration and renders a safe
 * error state if anything provided is malformed (a misconfigured container fails
 * loudly instead of calling a broken endpoint).
 *
 * The router is the Expert-Hub-only `createExpertHubRouter()` — **not** the
 * shared combined router — so the production build serves Expert Hub alone.
 */
const router = createExpertHubRouter();

function ConfigError({ problems }: { readonly problems: readonly string[] }) {
  return (
    <div
      role="alert"
      style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}
    >
      <div style={{ maxWidth: '40rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
          خطأ في الإعداد / Configuration error
        </h1>
        <p style={{ marginBottom: '1rem', lineHeight: 1.7 }}>
          تعذّر تشغيل التطبيق بسبب إعداد غير صالح. يُرجى مراجعة إعدادات النشر.
          <br />
          The application could not start because its runtime configuration is invalid.
        </p>
        <ul style={{ textAlign: 'start', lineHeight: 1.7 }}>
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ExpertHubApp() {
  const problems = [
    ...validateRuntimeConfig(readRuntimeConfig()),
    ...deploymentProblems(expertHubConfig),
  ];
  if (problems.length > 0) {
    return <ConfigError problems={problems} />;
  }

  return (
    <ExpertHubErrorBoundary>
      <ThemeProvider>
        <DirectionProvider>
          <LocaleProvider>
            <RouterProvider router={router} />
          </LocaleProvider>
        </DirectionProvider>
      </ThemeProvider>
    </ExpertHubErrorBoundary>
  );
}
