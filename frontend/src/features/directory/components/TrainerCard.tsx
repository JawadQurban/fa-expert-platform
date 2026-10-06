import { Card } from '@ds/composite';
import { Avatar, Link, Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import { formatNumber } from '../../../shared/formatting';
import { apiUrl } from '../../../shared/services/apiClient';
import type { DirectoryContent } from '../directory.content';
import type { PublicTrainerSummaryDto } from '../directory.types';
import styles from './TrainerCard.module.css';

/**
 * One directory result card (EH-PUB-02 results grid).
 *
 * The card carries what `P-335` publishes: photo, name, field, programmes
 * delivered and classification. Classification is plain text — the «معتمد»
 * badge (a `Tag`) was removed by the same ruling — and city is no longer
 * public. No rating (`P-40`/`P-41`).
 *
 * The name is the single discernible link to the public profile
 * (`05` EH-PUB-02 §18).
 */
export function TrainerCard({
  trainer,
  content,
  locale,
}: {
  readonly trainer: PublicTrainerSummaryDto;
  readonly content: DirectoryContent;
  readonly locale: Locale;
}) {
  return (
    <Card effect="stroke" className={styles.card}>
      <div className={styles.header}>
        <Avatar
          name={trainer.name}
          src={trainer.photoUrl == null ? undefined : apiUrl(trainer.photoUrl)}
          size="xl"
          border
          decorative
        />
        <div className={styles.identity}>
          <Typography as="h2" variant="text-lg" weight="bold" className={styles.name}>
            <Link href={expertHubPaths.directoryProfile(trainer.id)} className={styles.nameLink}>
              {trainer.name}
            </Link>
          </Typography>
        </div>
      </div>

      <ul className={styles.specialties} aria-label={content.card.specialtiesLabel}>
        {trainer.specialties.map((specialty) => (
          <li key={specialty}>
            <Tag variant="neutral" size="sm">
              {content.specialties[specialty]}
            </Tag>
          </li>
        ))}
      </ul>

      {/* Labelled facts, not a layout — hence a definition list. */}
      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt className={styles.factLabel}>{content.card.classificationLabel}</dt>
          <dd className={styles.factValue}>{content.classifications[trainer.classification]}</dd>
        </div>
        <div className={styles.fact}>
          <dt className={styles.factLabel}>{content.card.programsLabel}</dt>
          <dd className={styles.factValue}>{formatNumber(trainer.programsDelivered, locale)}</dd>
        </div>
      </dl>

      <div className={styles.foot}>
        {/*
          The visible label is the same on every card, so on its own it gives
          a screen-reader user a list of identical links (WCAG 2.4.4). The
          per-trainer name was already written in both locales and unused —
          it becomes the accessible name here.
        */}
        <Link
          href={expertHubPaths.directoryProfile(trainer.id)}
          aria-label={content.card.viewProfile(trainer.name)}
        >
          {content.card.viewProfileShort}
        </Link>
      </div>
    </Card>
  );
}
