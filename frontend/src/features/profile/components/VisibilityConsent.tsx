import { Alert } from '@ds/composite';
import { Switch, Tag } from '@ds/primitives';
import type { ProfileContent } from '../profile.content';
import styles from './VisibilityConsent.module.css';

/**
 * Visibility consent (`BR-1002/1007`) — the Switch that publishes/hides the
 * trainer in the public directory (EH-PUB-02/03). It **requests** a toggle; the
 * page owns the confirmation dialog (immediate public effect) and the service
 * call, so the switch stays put until the change is confirmed (no visual
 * flip-flop). A status Tag states the current state as text (not colour-only).
 *
 * ⚠️ RUN-005 — the Tag states what the DIRECTORY does (`listed`), not what the
 * switch says: consent alone does not list a trainer whose agreement is not in
 * force, and the page must not claim «ظاهر» when the directory leaves them out.
 * With no Expert Hub trainer file there is nothing to publish (the server
 * answers 404), so the switch is disabled and says why instead of failing.
 */
export function VisibilityConsent({
  consent,
  established,
  listed,
  content,
  busy,
  onRequestToggle,
}: {
  readonly consent: boolean;
  readonly established: boolean;
  readonly listed: boolean;
  readonly content: ProfileContent;
  readonly busy: boolean;
  readonly onRequestToggle: (next: boolean) => void;
}) {
  const copy = content.visibility;
  return (
    <div className={styles.stack}>
      <div className={styles.wrap}>
        <Switch
          label={copy.toggleLabel}
          description={listed ? copy.toggleOnDescription : undefined}
          checked={consent}
          disabled={busy || !established}
          onCheckedChange={onRequestToggle}
        />
        <Tag variant={listed ? 'success' : 'neutral'} size="sm">
          {listed ? copy.on : copy.off}
        </Tag>
      </div>
      {!established && (
        <Alert tone="info" surface="tinted" role="note">
          {copy.notEstablished}
        </Alert>
      )}
      {established && consent && !listed && (
        <Alert tone="warning" surface="tinted" role="note">
          {copy.consentedNotListed}
        </Alert>
      )}
    </div>
  );
}
