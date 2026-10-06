import { Icon, Typography } from '@ds/primitives';
import { ItemIcon } from '@ds/composite';
import type { ApplicationDetailContent } from '../applicationDetail.content';
import styles from './ApplicationActionPanel.module.css';

/**
 * P-21 Contextual Action Panel — **stage-driven, not audience-driven** (`04`
 * §6). It renders the resting state: no action is due from the applicant right
 * now. The page owns which panel to show for the current stage.
 *
 * The two stages that *do* carry an action each own a component, because each
 * turned out to be a decision with several answers rather than a single button:
 * `InterviewPanel` (J-06 — choose a time, or ask for another) and
 * `AgreementDecisionPanel` (J-11 — e-sign, reject, or request a modification).
 * Both carry the same `eh-action-heading` id, so focus management after an
 * action is identical whichever panel is on screen (`04` §13).
 */
export function ApplicationActionPanel({
  content,
}: {
  readonly content: ApplicationDetailContent;
}) {
  return (
    <section className={styles.panel} aria-labelledby="eh-action-heading">
      <div className={styles.head}>
        <ItemIcon contained icon={<Icon name="note-01" size="md" tone="primary" decorative />} />
        <Typography as="h2" id="eh-action-heading" variant="text-lg" weight="bold" tabIndex={-1}>
          {content.action.heading}
        </Typography>
      </div>

      <Typography as="p" variant="text-md" color="muted">
        {content.action.readOnly}
      </Typography>
    </section>
  );
}
