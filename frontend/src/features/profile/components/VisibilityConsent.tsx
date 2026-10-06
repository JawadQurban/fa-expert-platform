import { Switch, Tag } from '@ds/primitives';
import type { ProfileContent } from '../profile.content';
import styles from './VisibilityConsent.module.css';

/**
 * Visibility consent (`BR-1002/1007`) — the Switch that publishes/hides the
 * trainer in the public directory (EH-PUB-02/03). It **requests** a toggle; the
 * page owns the confirmation dialog (immediate public effect) and the service
 * call, so the switch stays put until the change is confirmed (no visual
 * flip-flop). A status Tag states the current state as text (not colour-only).
 */
export function VisibilityConsent({
  consent,
  content,
  busy,
  onRequestToggle,
}: {
  readonly consent: boolean;
  readonly content: ProfileContent;
  readonly busy: boolean;
  readonly onRequestToggle: (next: boolean) => void;
}) {
  return (
    <div className={styles.wrap}>
      <Switch
        label={content.visibility.toggleLabel}
        description={consent ? content.visibility.toggleOnDescription : undefined}
        checked={consent}
        disabled={busy}
        onCheckedChange={onRequestToggle}
      />
      <Tag variant={consent ? 'success' : 'neutral'} size="sm">
        {consent ? content.visibility.on : content.visibility.off}
      </Tag>
    </div>
  );
}
