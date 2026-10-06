import { ItemIcon, Steps } from '@ds/composite';
import type { StepItem } from '@ds/composite';
import { Icon, Typography } from '@ds/primitives';
import type { ApplicationDetailContent } from '../applicationDetail.content';
import type { TimelineStageDto } from '../applicationDetail.types';
import styles from './StatusTimeline.module.css';

/**
 * P-04 Status Timeline — the accreditation stages as the approved `Steps`
 * component. The current stage is programmatically indicated (`Steps` sets
 * `aria-current`); a rejected stage carries the DS error treatment. Stage
 * labels come from content (`P-05` vocabulary) — no copy here.
 */
export function StatusTimeline({
  timeline,
  content,
}: {
  readonly timeline: readonly TimelineStageDto[];
  readonly content: ApplicationDetailContent;
}) {
  const current = timeline.find((stage) => stage.state === 'current' || stage.state === 'rejected');
  const steps: StepItem[] = timeline.map((stage) => ({
    id: stage.id,
    label: content.stages[stage.id],
    error: stage.state === 'rejected',
  }));
  const completedIds = timeline
    .filter((stage) => stage.state === 'complete')
    .map((stage) => stage.id);

  return (
    <section className={styles.timeline} aria-labelledby="eh-timeline-heading">
      <div className={styles.head}>
        <ItemIcon
          contained
          icon={<Icon name="dashboard-circle" size="md" tone="primary" decorative />}
        />
        <Typography as="h2" id="eh-timeline-heading" variant="text-lg" weight="bold">
          {content.timeline.heading}
        </Typography>
      </div>
      <Steps
        steps={steps}
        currentId={current?.id ?? steps[0]?.id ?? ''}
        completedIds={completedIds}
        label={content.timeline.label}
      />
    </section>
  );
}
