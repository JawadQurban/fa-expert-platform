import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Card, EmptyState, ItemIcon, Loading } from '@ds/composite';
import { Avatar, Button, Icon, Tag, Typography } from '@ds/primitives';
import type { IconName } from '@ds/primitives';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import { getHomeService } from './homeService';
import { getHomeContent } from './home.content';
import type { PortalHomeDto } from './home.types';
import { HomeMetricCard } from './components/HomeMetricCard';
import { RatingSummary } from './components/RatingSummary';
import { NotificationsPreview } from './components/NotificationsPreview';
import { CompleteProfilePrompt } from './components/CompleteProfilePrompt';
import styles from './PortalHomePage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { formatNumber } from '../../shared/formatting';

/**
 * EH-TP-01 — Portal Home (`/expert-hub/home`, trainer). A read-only, **own-scope**
 * (`BR-0902`) personal overview: derived application metrics + the calculated
 * overall rating (P-06) + quick links + a notifications preview (P-09). Consumes
 * **only** `homeService` (mock now, Expert Hub summary API later). No writes.
 *
 * Role note: the spec role-resolves `/expert-hub` (trainer → this, staff →
 * EH-INT-01); implemented at `/expert-hub/home` behind the trainer guard for now
 * — the same-URL render is a later routing reconciliation (`05` §0.3).
 */
function formatCount(value: number, locale: Locale): string {
  return formatNumber(value, locale);
}

/**
 * One figure in the identity band.
 *
 * Deliberately plain: the band is already the loudest thing on the page, and a
 * second decorated element inside it would compete with the person's own name.
 */
function BandStat({ value, label }: { readonly value: string; readonly label: string }) {
  return (
    <div className={styles.bandStat}>
      <Typography as="span" variant="display-md" weight="bold" color="inverse">
        {value}
      </Typography>
      <Typography as="span" variant="text-sm" color="inverse">
        {label}
      </Typography>
    </div>
  );
}

/** Icon-badge + heading — a consistent section lead-in. */
function SectionHead({
  icon,
  id,
  children,
}: {
  readonly icon: IconName;
  readonly id?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className={styles.sectionHead}>
      <ItemIcon contained icon={<Icon name={icon} size="md" tone="primary" decorative />} />
      <Typography as="h2" id={id} variant="text-lg" weight="bold">
        {children}
      </Typography>
    </div>
  );
}

export default function PortalHomePage() {
  const { locale } = useLocale();
  const content = useMemo(() => getHomeContent(locale), [locale]);
  const service = getHomeService();

  const [home, setHome] = useState<PortalHomeDto | null>(null);
  const [phase, setPhase] = useState<'loading' | 'error' | 'session' | 'ready'>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void service.getPortalHome().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setHome(result.value);
        setPhase('ready');
      } else if (result.error.status === 401) {
        setPhase('session');
      } else {
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-home-title')?.focus();
    }
  }, [phase]);

  const shortcuts = [
    {
      id: 'applications',
      icon: 'note-01' as IconName,
      title: content.shortcuts.applicationsTitle,
      desc: content.shortcuts.applicationsDesc,
      href: expertHubPaths.applications,
    },
    {
      id: 'new',
      icon: 'add-circle' as IconName,
      title: content.shortcuts.newApplicationTitle,
      desc: content.shortcuts.newApplicationDesc,
      href: expertHubPaths.applicationsNew,
    },
    {
      id: 'profile',
      icon: 'note-edit' as IconName,
      title: content.shortcuts.profileTitle,
      desc: content.shortcuts.profileDesc,
      href: expertHubPaths.profile,
    },
    {
      // J-18/F3/AC-2 — the confirmed engagement is meant to be reachable from
      // the dashboard, so the dashboard carries the way in.
      id: 'engagements',
      icon: 'note-done' as IconName,
      title: content.shortcuts.engagementsTitle,
      desc: content.shortcuts.engagementsDesc,
      href: expertHubPaths.engagements,
    },
    {
      id: 'directory',
      icon: 'co-present' as IconName,
      title: content.shortcuts.directoryTitle,
      desc: content.shortcuts.directoryDesc,
      href: expertHubPaths.directory,
    },
  ];

  const renderShortcuts = () => (
    <section className={styles.shortcuts} aria-labelledby="eh-home-shortcuts">
      <SectionHead icon="co-present" id="eh-home-shortcuts">
        {content.shortcuts.heading}
      </SectionHead>
      <ul className={styles.shortcutGrid}>
        {shortcuts.map((link) => (
          <li key={link.id} className={styles.shortcutItem}>
            <a className={styles.shortcutCard} href={link.href}>
              <ItemIcon
                contained
                icon={<Icon name={link.icon} size="md" tone="primary" decorative />}
              />
              <span className={styles.shortcutTitle}>{link.title}</span>
              <span className={styles.shortcutDesc}>{link.desc}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );

  if (phase === 'loading') {
    return (
      <Section aria-label={content.eyebrow}>
        <Container>
          <Loading variant="skeleton" lines={8} label={content.eyebrow} />
        </Container>
      </Section>
    );
  }

  if (phase !== 'ready' || home == null) {
    const copy =
      phase === 'session'
        ? { title: content.errors.sessionTitle, body: content.errors.sessionBody }
        : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={copy.title}
        body={copy.body}
        onRetry={phase === 'error' ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
      />
    );
  }

  const metrics = [
    {
      id: 'total',
      icon: 'note-01' as IconName,
      value: home.applications.total,
      label: content.metrics.total,
    },
    {
      id: 'in-progress',
      icon: 'search-list-01' as IconName,
      value: home.applications.inProgress,
      label: content.metrics.inProgress,
    },
    {
      id: 'approved',
      icon: 'task-done-01' as IconName,
      value: home.applications.approved,
      label: content.metrics.approved,
    },
    {
      id: 'programs',
      icon: 'co-present' as IconName,
      value: home.programsCount,
      label: content.metrics.programs,
    },
  ];

  return (
    <Section aria-labelledby="eh-home-title">
      {/*
        ⚠️ Only ever renders for a trainer whose role came from the Academy
        and who has no Expert Hub file — it decides that itself, from the
        profile. Everybody else gets nothing at all.
      */}
      <CompleteProfilePrompt />

      {/*
        The identity band — full-bleed dark green, and the one high-emphasis
        moment on the page (FADS Expert Hub UI kit, EH-TP-01). It sits OUTSIDE
        the container so the colour runs edge to edge; the content inside is
        still contained, so nothing loses its measure.
      */}
      <div className={styles.band}>
        <Container>
          <div className={styles.bandInner}>
            <div className={styles.bandIdentity}>
              <Avatar name={home.displayName} size="3xl" border decorative />
              <div className={styles.identity}>
                <Typography as="p" variant="text-sm" weight="bold" color="inverse">
                  {content.eyebrow}
                </Typography>
                <Typography
                  as="h1"
                  id="eh-home-title"
                  variant="display-lg"
                  color="inverse"
                  tabIndex={-1}
                >
                  {content.greeting(home.displayName)}
                </Typography>
                <div className={styles.heroMeta}>
                  {/*
                  ⚠️ A classification is shown ONLY to a trainer. Everybody else
                  is named by the role they actually hold. Telling a person
                  their standing with a government body is something it is not
                  was the bug this replaced — the page used to greet anyone
                  without a trainer file as «مدرب معتمد».
                */}
                  <Tag variant="onColor" size="md">
                    {home.classification == null
                      ? content.individualStanding
                      : content.classifications[home.classification]}
                  </Tag>
                </div>
              </div>
            </div>

            {/*
              The two figures a trainer opens this page to see, read at a
              glance from the band rather than hunted for among the tiles.
              The rating is omitted rather than shown as a zero when there is
              nothing to average — `ratingState` says so.
            */}
            <div className={styles.bandFacts}>
              <BandStat
                value={formatCount(home.applications.inProgress, locale)}
                label={content.band.inProgress}
              />
              {home.overallRating != null && (
                <>
                  <span aria-hidden="true" className={styles.bandRule} />
                  <BandStat
                    value={formatCount(home.overallRating, locale)}
                    label={content.band.rating}
                  />
                </>
              )}
              <Button variant="primary" size="lg" onColor href={expertHubPaths.applications}>
                {content.primaryCta}
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        {home.hasActivity ? (
          <>
            <ul className={styles.metrics} aria-label={content.metricsLabel}>
              {metrics.map((metric) => (
                <li key={metric.id} className={styles.metricItem}>
                  <HomeMetricCard
                    icon={metric.icon}
                    value={formatCount(metric.value, locale)}
                    label={metric.label}
                  />
                </li>
              ))}
            </ul>

            <div className={styles.grid}>
              {/*
                Quick links first, then the rating (FADS Expert Hub kit,
                EH-TP-01). The order is the difference between a page that
                offers a trainer their next action and one that opens with a
                score: what they came to do belongs above how they are doing.
              */}
              <div className={styles.mainColumn}>
                {renderShortcuts()}
                <Card effect="stroke" className={styles.card}>
                  <SectionHead icon="task-done-01">{content.rating.heading}</SectionHead>
                  <RatingSummary home={home} content={content} locale={locale} />
                </Card>
              </div>

              <div className={styles.sideColumn}>
                <Card effect="stroke" className={styles.card}>
                  <SectionHead icon="note-01">{content.notifications.heading}</SectionHead>
                  <NotificationsPreview
                    notifications={home.notifications}
                    content={content}
                    locale={locale}
                  />
                </Card>

                <Card effect="stroke" className={styles.card}>
                  <SectionHead icon="co-present">{content.visibility.heading}</SectionHead>
                  <div className={styles.visibilityRow}>
                    <Tag variant={home.visibilityConsent ? 'success' : 'neutral'} size="sm">
                      {home.visibilityConsent ? content.visibility.on : content.visibility.off}
                    </Tag>
                    <Button variant="tertiary" size="sm" href={expertHubPaths.profile}>
                      {content.visibility.manage}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <>
            <EmptyState
              icon={<Icon name="note-add" size="featured" tone="primary" decorative />}
              title={content.empty.title}
              description={content.empty.body}
              action={
                <Button variant="primary" size="md" href={expertHubPaths.applicationsNew}>
                  {content.empty.cta}
                </Button>
              }
            />
            {renderShortcuts()}
          </>
        )}
      </Container>
    </Section>
  );
}
