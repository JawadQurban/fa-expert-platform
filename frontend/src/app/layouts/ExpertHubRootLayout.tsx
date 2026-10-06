import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthProvider';

/**
 * Expert Hub root layout — the top of the Expert Hub route subtree. It mounts
 * the Expert Hub `AuthProvider` (so authentication is a property of this
 * standalone product, never of the shared Hackathon provider tree) and renders
 * the matched child layout via `<Outlet/>`. It deliberately renders no DOM
 * chrome itself; each child layout (public / portal / internal) provides the
 * full landmark shell. It does **not** use the Hackathon `RootLayout`.
 */
export function ExpertHubRootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
