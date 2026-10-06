import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ItemIcon, Loading } from '@ds/composite';
import { Avatar, Button, Icon, Tag, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import type { PublicTrainerProfileDto } from './directory.types';
import { getDirectoryService } from './directoryService';
import { getPublicProfileContent } from './directory.content';
import styles from './PublicTrainerProfilePage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { formatNumber } from '../../shared/formatting';

/**
 * EH-PUB-03 — Public Trainer Profile (`/expert-hub/directory/:trainerId`,
 * public). One consented trainer's public profile, limited to exactly what
 * **J-24/F2/AC-1** enumerates: name, specialization, and the programs delivered
 * with the Academy — "with no financial or sensitive personal data"
 * (`BR-1004`, corrected).
 *
 * The enumeration is exhaustive, so on 2026-08-19 this page dropped the general
 * classification, the public bio (`BR-1004` corrected: "no free-text bio field,
 * since none exists"), the calculated evaluation with its per-specialty
 * breakdown, and the years-of-experience / trainees-trained facts. The journey's
 * open item records that public evaluation display is "fully removed from this
 * journey for now" — see `DECISIONS.md` P-40/P-41 and `directory.types.ts`.
 *
 * **Privacy-preserving resolution (`BR-1007`):** an unknown id and a
 * consented-withdrawn id are indistinguishable — the service returns the same
 * `404`, and this page renders a single neutral "not available" state for both,
 * never revealing whether a trainer exists but withheld consent. Only a genuine
 * transport failure (status 0 / 5xx) shows the retryable error state.
 *
 * Consumes **only** `directoryService` (mock now, public Expert Hub API later).
 */

type Phase = 'loading' | 'not-found' | 'error' | 'ready';

/** A delivery year — `useGrouping: false`, so 2024 is not rendered as "2,024". */
function formatYear(value: number, locale: Locale): string {
  return formatNumber(value, locale, { useGrouping: false });
}

export default function PublicTrainerProfilePage() {
  const { locale } = useLocale();
  const content = useMemo(() => getPublicProfileContent(locale), [locale]);
  const { trainerId } = useParams();
  const service = getDirectoryService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [trainer, setTrainer] = useState<PublicTrainerProfileDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    if (trainerId == null) {
      setPhase('not-found');
      return;
    }
    void service.getPublicTrainer(trainerId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setTrainer(result.value);
        setPhase('ready');
      } else if (result.error.status === 404) {
        // Unknown id OR withheld consent — the same neutral not-found (privacy).
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
      document.title = content.documentTitle(trainer.name);
    }
  }, [trainer, content]);

  // Focus lands on the profile name (H1) on first successful load.
  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-profile-title')?.focus();
    }
  }, [phase]);

  const retry = () => setReloadKey((key) => key + 1);

  if (phase === 'loading') {
    return (
      <Section aria-label={content.breadcrumbDirectory}>
        <Container>
          <Loading variant="skeleton" lines={6} label={content.breadcrumbDirectory} />
        </Container>
      </Section>
    );
  }

  if (phase !== 'ready' || trainer == null) {
    const copy =
      phase === 'not-found'
        ? { title: content.notFound.title, body: content.notFound.body }
        : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={copy.title}
        body={copy.body}
        onRetry={phase === 'error' ? retry : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.directory}>
            {content.backToDirectory}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className={styles.crumbs}>
        <Container>
          <Breadcrumbs
            items={[
              { label: content.breadcrumbDirectory, href: expertHubPaths.directory },
              { label: trainer.name },
            ]}
            label={content.breadcrumbLabel}
          />
        </Container>
      </div>

      {/*
        Identity band (P-10, public variant) — whitelisted identity only, on the
        brand's dark ground. The same treatment as the trainer's own portal home
        (FADS Expert Hub UI kit), so the platform's two «who is this person»
        screens read as one product rather than two.

        ⚠️ What is on it is unchanged: the name and the specializations the
        trainer consented to publish. `J-24/F2/AC-1` enumerates the public
        fields, and a more prominent header is not a licence to add one.
      */}
      <section className={styles.band} aria-labelledby="eh-profile-title">
        <Container>
          <div className={styles.bandInner}>
            <Avatar name={trainer.name} size="3xl" border decorative />
            <div className={styles.identity}>
              <Typography
                as="h1"
                id="eh-profile-title"
                variant="display-lg"
                color="inverse"
                tabIndex={-1}
              >
                {trainer.name}
              </Typography>
              <div className={styles.specialtiesBlock}>
                <Typography as="h2" variant="text-sm" weight="bold" color="inverse">
                  {content.specialtiesLabel}
                </Typography>
                <ul className={styles.specialties}>
                  {trainer.specialties.map((specialty) => (
                    <li key={specialty}>
                      <Tag variant="onColor" size="sm">
                        {content.specialties[specialty]}
                      </Tag>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          {/* J-24/F2/AC-1 — the programs delivered with the Academy. This is the
            only enrichment the public profile may carry beyond identity and
            specialization. The previous facts row (years of experience, programs
            count, trainee count), the per-specialty evaluation breakdown and the
            public bio were removed on 2026-08-19: AC-1 enumerates the public
            fields, and the journey's open item records that public evaluation
            display is "fully removed for now". */}
          {/* `P-331` — the short bio, added by the owner's ruling of 2026-10-05:
            only the text trainer management approved, and only because the
            trainer consented to this page existing at all. */}
          {trainer.bio != null && (
            <section className={styles.programsSection} aria-labelledby="eh-profile-bio-heading">
              <div className={styles.sectionHead}>
                <ItemIcon
                  contained
                  icon={<Icon name="note-edit" size="md" tone="primary" decorative />}
                />
                <Typography as="h2" id="eh-profile-bio-heading" variant="text-lg" weight="bold">
                  {content.bioHeading}
                </Typography>
              </div>
              <Typography as="p" variant="text-md">
                {trainer.bio}
              </Typography>
            </section>
          )}

          <section className={styles.programsSection} aria-labelledby="eh-profile-programs-heading">
            <div className={styles.sectionHead}>
              <ItemIcon
                contained
                icon={<Icon name="task-done-01" size="md" tone="primary" decorative />}
              />
              <Typography as="h2" id="eh-profile-programs-heading" variant="text-lg" weight="bold">
                {content.programs.heading}
              </Typography>
            </div>

            {trainer.deliveredPrograms.length === 0 ? (
              <Typography as="p" variant="text-md" color="muted">
                {content.programs.empty}
              </Typography>
            ) : (
              <ul className={styles.programsList}>
                {trainer.deliveredPrograms.map((program) => (
                  <li key={program.id} className={styles.programRow}>
                    <Typography as="span" variant="text-md">
                      {program.name}
                    </Typography>
                    <Typography as="span" variant="text-sm" color="muted">
                      <bdi>{formatYear(program.year, locale)}</bdi>
                    </Typography>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className={styles.backRow}>
            <Button variant="tertiary" size="md" href={expertHubPaths.directory}>
              {content.backToDirectory}
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
