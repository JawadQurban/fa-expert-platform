import { Outlet } from 'react-router-dom';
import { ExpertHubShell } from '../../shared/components/ExpertHubShell';

/** Expert Hub authenticated trainer (portal) layout — self-service shell for a
 *  signed-in trainer. Rendered only behind `RequireAuth`, so its header's
 *  account/log-out actions always reflect a real session. */
export function PortalLayout() {
  return (
    <ExpertHubShell variant="portal">
      <Outlet />
    </ExpertHubShell>
  );
}
