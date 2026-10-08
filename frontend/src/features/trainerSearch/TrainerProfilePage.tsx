import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Loading, Rating } from '@ds/composite';
import { Button, Icon, Tag, Typography } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import type { TrainerFileStatus, TrainerProfileDto } from './trainerSearch.types';
import { getTrainerSearchService } from './trainerSearchService';
import { getTrainerSearchContent } from './trainerSearch.content';
import { IdentityCardPanel } from './components/IdentityCardPanel';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { RecordHead } from '../../shared/workspace/RecordHead';
import { apiUrl } from '../../shared/services/apiClient';
import { Panel } from '../../shared/workspace/Panel';
import styles from './TrainerProfilePage.module.css';
import { formatDate as formatLocaleDate, formatNumber } from '../../shared/formatting';

/**
 * EH-INT-08 — Unified Trainer Profile (`/expert-hub/internal/trainers/:trainerId`,
 * staff). **J-15/F1/AC-1**: "the trainer's complete data **in one screen**".
 *
 * "One screen" is the requirement, so this page does not tab the data away —
 * personal details, the record with the Academy, the evaluation with its sync
 * date, the agreement, and the file status all render together. Tabs would
 * satisfy the letter and lose the point, which is that staff can see the whole
 * picture before making a call.
 *
 * ⚠️ The Option B prototype draws this screen with tabs. The journey's AC wins:
 * the prototype's record head and panels are applied, its tab strip is not.
 *
 * **The evaluation carries its last sync date** (AC-1, `02D` §9). Internal views
 * show the provenance the trainer's own view does not: a score with no idea how
 * stale it is invites a decision it cannot support.
 *
 * **File status is displayed** (AC-2, `BR-0408`) — the internal half of the rule
 * that keeps it off the trainer's own profile (J-13/AC-10, P-48).
 */

type Phase = 'loading' | 'error' | 'not-found' | 'ready';

const FILE_STATUS_VARIANT: Readonly<Record<TrainerFileStatus, TagVariant>> = {
  active: 'success',
  idle: 'neutral',
  suspended: 'warning',
  expired: 'error',
};

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatScore(value: number, locale: Locale): string {
  return formatNumber(value, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export default function TrainerProfilePage() {
  const { locale } = useLocale();
  const content = useMemo(() => getTrainerSearchContent(locale), [locale]);
  const { trainerId } = useParams();
  const service = getTrainerSearchService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [trainer, setTrainer] = useState<TrainerProfileDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    if (trainerId == null) {
      setPhase('not-found');
      return;
    }
    void service.getTrainerProfile(trainerId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setTrainer(result.value);
        setPhase('ready');
      } else if (result.error.status === 404) {
        setPhase('not-found');
      } else {
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerId, reloadKey]);

  useEffect(() => {
    if (trainer != null) {
      document.title = content.profile.documentTitle(trainer.name);
    }
  }, [trainer, content]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-trainer-title')?.focus();
    }
  }, [phase]);

  if (phase === 'loading') {
    return (
      <WorkspacePage label={content.title}>
        <Loading variant="skeleton" lines={8} label={content.title} />
      </WorkspacePage>
    );
  }

  if (phase !== 'ready' || trainer == null) {
    const copy =
      phase === 'not-found'
        ? { title: content.errors.notFoundTitle, body: content.errors.notFoundBody }
        : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={copy.title}
        body={copy.body}
        onRetry={phase === 'error' ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.internalTrainers}>
            {content.errors.backToSearch}
          </Button>
        }
      />
    );
  }

  const copy = content.profile;

  return (
    <WorkspacePage labelledBy="eh-trainer-title">
      <Breadcrumbs
        items={[
          { label: copy.breadcrumbSearch, href: expertHubPaths.internalTrainers },
          { label: trainer.name },
        ]}
        label={copy.breadcrumbLabel}
      />

      <RecordHead
        titleId="eh-trainer-title"
        title={trainer.name}
        person={trainer.name}
        personImage={trainer.avatarUrl == null ? undefined : apiUrl(trainer.avatarUrl)}
        meta={[
          trainer.services
            .map((service) => content.services[service])
            .join(locale === 'ar' ? '، ' : ', '),
          <bdi>{trainer.city}</bdi>,
          trainer.agreement != null ? <bdi>{trainer.agreement.reference}</bdi> : undefined,
        ]}
        tags={
          <>
            <Tag variant="information" size="sm">
              {content.classifications[trainer.classification]}
            </Tag>
            {/* AC-2 — internal-only (`BR-0408`). */}
            <Tag variant={FILE_STATUS_VARIANT[trainer.fileStatus]} size="sm">
              {content.fileStatuses[trainer.fileStatus]}
            </Tag>
          </>
        }
      >
        {trainer.fileStatus === 'idle' && (
          <Typography as="p" variant="text-xs" color="muted">
            {content.idleNote}
          </Typography>
        )}
      </RecordHead>

      {/* AC-1 — one screen. Everything below renders together, not in tabs. */}
      <div className={styles.grid}>
        <div className={styles.column}>
          {trainer.bio != null && (
            <Panel title={copy.bioHeading} titleId="eh-trainer-bio">
              <Typography as="p" variant="text-md">
                {trainer.bio}
              </Typography>
            </Panel>
          )}
          <Panel title={copy.personalHeading} titleId="eh-trainer-personal">
            <dl className={styles.facts}>
              {(
                [
                  [copy.emailLabel, trainer.email],
                  [copy.phoneLabel, trainer.phone],
                  [copy.cityLabel, trainer.city],
                  [copy.experienceLabel, content.yearsValue(trainer.yearsExperience)],
                  [copy.qualificationLabel, trainer.academicQualification],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className={styles.fact}>
                  <dt className={styles.term}>{label}</dt>
                  <dd className={styles.value}>
                    <bdi>{value}</bdi>
                  </dd>
                </div>
              ))}
            </dl>

            <div className={styles.tagBlock}>
              <Typography as="h3" variant="text-xs" weight="bold" color="muted">
                {copy.servicesLabel}
              </Typography>
              <ul className={styles.tags}>
                {trainer.services.map((service) => (
                  <li key={service}>
                    <Tag variant="success" size="sm">
                      {content.services[service]}
                    </Tag>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.tagBlock}>
              <Typography as="h3" variant="text-xs" weight="bold" color="muted">
                {copy.specialtiesLabel}
              </Typography>
              <ul className={styles.tags}>
                {trainer.specialties.map((specialty) => (
                  <li key={specialty}>
                    <Tag variant="neutral" size="sm">
                      {content.specialties[specialty]}
                    </Tag>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.tagBlock}>
              <Typography as="h3" variant="text-xs" weight="bold" color="muted">
                {copy.certificationsHeading}
              </Typography>
              <ul className={styles.list}>
                {trainer.certifications.map((certification) => (
                  <li key={certification}>
                    <bdi>{certification}</bdi>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          {/* AC-1 — the record with the Academy. */}
          <Panel title={copy.recordHeading} titleId="eh-trainer-record">
            {trainer.record.length === 0 ? (
              <Typography as="p" variant="text-sm" color="muted">
                {copy.recordEmpty}
              </Typography>
            ) : (
              <ul className={styles.list}>
                {trainer.record.map((entry) => (
                  <li key={entry.id} className={styles.recordRow}>
                    <Typography as="span" variant="text-sm" weight="bold">
                      {entry.name}
                    </Typography>
                    <Typography as="span" variant="text-xs" color="muted">
                      {copy.recordEntry(entry.role, String(entry.year))}
                    </Typography>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className={styles.column}>
          {/* AC-1 — the evaluation, WITH its last sync date. */}
          <Panel title={copy.evaluationHeading} titleId="eh-trainer-evaluation">
            {trainer.evaluation.overall == null ? (
              <Typography as="p" variant="text-sm" color="muted">
                {content.notEvaluated}
              </Typography>
            ) : (
              <div className={styles.rating}>
                <Rating value={trainer.evaluation.overall} size="sm" brand />
                <bdi>{formatScore(trainer.evaluation.overall, locale)}</bdi>
              </div>
            )}
            {trainer.evaluation.perProgram.length > 0 && (
              <ul className={styles.list}>
                {trainer.evaluation.perProgram.map((row) => (
                  <li key={row.program} className={styles.recordRow}>
                    <Typography as="span" variant="text-sm">
                      {row.program}
                    </Typography>
                    <bdi>{formatScore(row.score, locale)}</bdi>
                  </li>
                ))}
              </ul>
            )}
            {/* Provenance — the internal view shows what the trainer's does not. */}
            <Typography as="p" variant="text-xs" color="muted">
              {trainer.evaluation.lastSyncedAt == null
                ? copy.evaluationNeverSynced
                : copy.evaluationSynced(formatDate(trainer.evaluation.lastSyncedAt, locale))}
            </Typography>
          </Panel>

          {/* AC-1 — the active agreement. */}
          <Panel title={copy.agreementHeading} titleId="eh-trainer-agreement">
            {trainer.agreement == null ? (
              <Typography as="p" variant="text-sm" color="muted">
                {copy.agreementNone}
              </Typography>
            ) : (
              <>
                <div className={styles.agreementRow}>
                  <Icon name="note-01" size="sm" tone="primary" decorative />
                  <bdi>{trainer.agreement.reference}</bdi>
                  <Tag
                    variant={trainer.agreement.status === 'active' ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {content.agreementStatuses[trainer.agreement.status]}
                  </Tag>
                </div>
                <Typography as="p" variant="text-xs" color="muted">
                  <bdi>
                    {copy.agreementTerm(
                      formatDate(trainer.agreement.startsAt, locale),
                      formatDate(trainer.agreement.endsAt, locale)
                    )}
                  </bdi>
                </Typography>
              </>
            )}
          </Panel>

          {/* F2 — the identity card. */}
          <IdentityCardPanel card={trainer.identityCard} content={content} locale={locale} />
        </div>
      </div>

      {/* J-15 scope, restated where a reader might reach for an action. */}
      <Alert tone="info" surface="tinted" role="note">
        {content.scopeNote}
      </Alert>
    </WorkspacePage>
  );
}
