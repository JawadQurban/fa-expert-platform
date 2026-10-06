import { Outlet } from 'react-router-dom';
import { ExpertHubShell } from '../../shared/components/ExpertHubShell';

/** Expert Hub public layout — the shell for unauthenticated pages (landing,
 *  login, callback, unauthorized, not-found): public header (Login + Apply) +
 *  neutral footer. */
export function PublicLayout() {
  return (
    <ExpertHubShell variant="public">
      <Outlet />
    </ExpertHubShell>
  );
}
