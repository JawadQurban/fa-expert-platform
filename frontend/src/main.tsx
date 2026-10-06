import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ds/tokens/global.css';
import { ExpertHubApp } from './app/ExpertHubApp';

/**
 * Expert Hub **standalone production bootstrap** — the entry the dedicated build
 * (`vite.config.ts` → `index.html`) mounts. It boots the
 * Expert-Hub-only application (`ExpertHubApp` → `createExpertHubRouter()`), so the
 * production image contains **no Hackathon code**.
 *
 * Local development still uses the shared combined entry (`src/main.tsx`), where
 * Expert Hub is a sibling route subtree; this file is what runs in the container
 * and after standalone extraction.
 */
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <ExpertHubApp />
  </StrictMode>
);
