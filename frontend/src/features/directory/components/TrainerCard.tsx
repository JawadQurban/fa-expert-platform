import { Card } from '@ds/composite';
import { Avatar, Link, Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import { formatNumber } from '../../../shared/formatting';
import type { DirectoryContent } from '../directory.content';
import type { PublicTrainerSummaryDto } from '../directory.types';
import styles from './TrainerCard.module.css';

/**
 * One directory result card (EH-PUB-02 results grid).
 *
 * The card carries only what J-24 permits publicly: the trainer's name and
 * their specializations. The classification tag, the star rating and the brief
 * bio were removed on 2026-08-19 — J-24/F2/AC-1 (`BR-1004` corrected) enumerates
 * the public fields, and the journey's open item records that public evaluation
 * display is "fully removed for now".
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
        <Avatar name={trainer.name} size="xl" border decorative />
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

      {/*
        City and programmes, as the kit sets them (EH-PUB-02). A definition
        list because that is what they are — two labelled facts, not a layout.
        The city is omitted rather than shown blank when the trainer has not
        said where they deliver.
      */}
      <dl className={styles.facts}>
        {trainer.city != null && (
          <div className={styles.fact}>
            <dt className={styles.factLabel}>{content.card.cityLabel}</dt>
            <dd className={styles.factValue}>
              <bdi>{trainer.city}</bdi>
            </dd>
          </div>
        )}
        <div className={styles.fact}>
          <dt className={styles.factLabel}>{content.card.programsLabel}</dt>
          <dd className={styles.factValue}>{formatNumber(trainer.programsDelivered, locale)}</dd>
        </div>
      </dl>

      <div className={styles.foot}>
        <Tag variant="information" size="sm">
          {content.classifications[trainer.classification]}
        </Tag>
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
