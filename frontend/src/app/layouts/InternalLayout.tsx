import { Outlet } from 'react-router-dom';
import { ExpertHubShell } from '../../shared/components/ExpertHubShell';

/** Expert Hub internal (operational) layout — staff shell. Rendered only behind
 *  `RequireAuth` + `RequireRole("internal")`, so it is reachable only by a
 *  signed-in user holding the internal role. */
export function InternalLayout() {
  return (
    <ExpertHubShell variant="internal">
      <Outlet />
    </ExpertHubShell>
  );
}
