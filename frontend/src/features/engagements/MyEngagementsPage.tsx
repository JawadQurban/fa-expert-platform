import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Card, EmptyState, Loading } from '@ds/composite';
import { Icon, Typography } from '@ds/primitives';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import { getEngagementService } from './engagementService';
import { getEngagementsContent } from './engagements.content';
import { isActive } from '../../contracts/engagementStatus';
import type { AssignmentOfferDto, MyEngagementDto, OfferResponse } from './offer.types';
import { OfferCard } from './components/OfferCard';
import { EngagementCard } from './components/EngagementCard';
import styles from './MyEngagementsPage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';

/**
 * EH-TP-07 — the trainer's side of **J-18**, at `/expert-hub/engagements`.
 *
 * Two sections, in the order the journey puts them: the offers waiting on this
 * trainer (F2), then **"My Engagements"** (F3/AC-2 — the journey names the
 * section, so the page does too).
 *
 * Things the page deliberately cannot do:
 *
 * - **It cannot send an offer**, because `EngagementService` has no such
 *   operation (F1/AC-1 makes sending automatic).
 * - **It cannot expire one.** The countdown is rendered from the server's SLA;
 *   an offer that lapsed while the page was open comes back `409`, and the page
 *   says so rather than pretending the answer landed.
 * - **It cannot decide whether the trainer may upload material.** F5/AC-3's rule
 *   arrives as `canUploadMaterial`, server-decided.
 */

type Phase = 'loading' | 'error' | 'ready';

export default function MyEngagementsPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getEngagementsContent(locale), [locale]);
  const service = getEngagementService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [offers, setOffers] = useState<readonly AssignmentOfferDto[]>([]);
  const [engagements, setEngagements] = useState<readonly MyEngagementDto[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<OfferResponse | null>(null);
  const [gone, setGone] = useState(false);
  const [actionFailed, setActionFailed] = useState(false);

  const loadedOnce = useRef(false);
  const justResponded = useRef(false);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    /*
      Responding to an offer bumps `reloadKey`, so this effect runs on an action
      and not only on arrival. Showing the skeleton then replaced the whole page
      — including the `role="status"` outcome the trainer had just produced —
      for the length of the reload, then built it back.

      Focus still arrived: `justResponded` survives the loading phase, because
      the focus effect returns early rather than consuming the flag while
      `phase !== 'ready'`. What the blank cost was the outcome being visibly
      torn down and remounted at the moment of the answer.

      Only a first arrival has nothing to preserve.
    */
    if (!loadedOnce.current) {
      setPhase('loading');
    }
    void Promise.all([service.listMyOffers(), service.listMyEngagements()]).then(
      ([offersResult, engagementsResult]) => {
        if (cancelled) {
          return;
        }
        if (!offersResult.ok || !engagementsResult.ok) {
          setPhase('error');
          return;
        }
        setOffers(offersResult.value);
        setEngagements(engagementsResult.value);
        setPhase('ready');
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    if (phase !== 'ready') {
      return;
    }
    if (justResponded.current) {
      justResponded.current = false;
      document.getElementById('eh-engagements-heading')?.focus();
    } else if (!loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-engagements-title')?.focus();
    }
  }, [phase, engagements]);

  const respond = (offerId: string, response: OfferResponse) => {
    setBusy(true);
    setGone(false);
    setActionFailed(false);
    void service.respondToOffer(offerId, { response }).then((result) => {
      setBusy(false);
      if (result.ok) {
        justResponded.current = true;
        setEngagements(result.value);
        setOutcome(response);
        // The answered offer is gone and the slot may have advanced, so the
        // list is re-read rather than patched locally.
        setReloadKey((key) => key + 1);
      } else if (result.error.status === 409) {
        // F2/AC-3 — "The response window has closed." or "Already answered.":
        // it lapsed or was answered while this page was open. Nothing was lost;
        // the offer simply moved on, and saying so beats a generic failure.
        setGone(true);
        setReloadKey((key) => key + 1);
      } else {
        setActionFailed(true);
      }
    });
  };

  if (phase === 'loading') {
    return (
      <Section aria-label={content.title}>
        <Container>
          <Loading variant="skeleton" lines={6} label={content.title} />
        </Container>
      </Section>
    );
  }

  if (phase === 'error') {
    return (
      <PageLoadError
        title={content.errors.loadTitle}
        body={content.errors.loadBody}
        onRetry={() => setReloadKey((key) => key + 1)}
        retryLabel={content.errors.retry}
        size="prose"
      />
    );
  }

  // J-21/F5/AC-2 — the move is a consequence of the server-derived status, not
  // of anything a person did. `isActive` is the central predicate, so the list
  // and the detail page cannot disagree about what "active" means.
  const active = engagements.filter((engagement) => isActive(engagement.lifecycle));
  const past = engagements.filter((engagement) => !isActive(engagement.lifecycle));

  return (
    <Section aria-labelledby="eh-engagements-title">
      <Container>
        <div className={styles.header}>
          <Typography as="h1" id="eh-engagements-title" variant="display-md" tabIndex={-1}>
            {content.title}
          </Typography>
          <Typography as="p" variant="text-md" color="muted">
            {content.intro}
          </Typography>
        </div>

        {outcome != null && (
          <Alert
            tone={outcome === 'accept' ? 'success' : 'info'}
            role="status"
            title={
              outcome === 'accept' ? content.offers.acceptedTitle : content.offers.rejectedTitle
            }
          >
            {outcome === 'accept' ? content.offers.acceptedBody : content.offers.rejectedBody}
          </Alert>
        )}
        {gone && (
          <Alert tone="warning" role="alert" title={content.offers.goneTitle}>
            {content.offers.goneBody}
          </Alert>
        )}
        {actionFailed && (
          <Alert tone="error" role="alert">
            {content.errors.actionFailed}
          </Alert>
        )}

        {/* ── F2 — the offers awaiting an answer ───────────────────────── */}
        <section className={styles.block} aria-labelledby="eh-offers-heading">
          <Typography as="h2" id="eh-offers-heading" variant="text-lg" weight="bold">
            {content.offers.heading}
          </Typography>
          <Typography as="p" variant="text-sm" color="muted">
            {content.offers.description}
          </Typography>
          {offers.length === 0 ? (
            <Card effect="stroke">
              <EmptyState
                icon={<Icon name="note-01" size="featured" tone="neutral" decorative />}
                title={content.offers.emptyTitle}
                description={content.offers.emptyBody}
              />
            </Card>
          ) : (
            <ul className={styles.list}>
              {offers.map((offer) => (
                <li key={offer.offerId}>
                  <OfferCard
                    offer={offer}
                    content={content}
                    locale={locale}
                    busy={busy}
                    onRespond={respond}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── F3/AC-2 — "My Engagements" ───────────────────────────────── */}
        <section className={styles.block} aria-labelledby="eh-engagements-heading">
          <Typography
            as="h2"
            id="eh-engagements-heading"
            variant="text-lg"
            weight="bold"
            tabIndex={-1}
          >
            {content.engagements.heading}
          </Typography>
          <Typography as="p" variant="text-sm" color="muted">
            {content.engagements.description}
          </Typography>
          {active.length === 0 ? (
            <Card effect="stroke">
              <EmptyState
                icon={<Icon name="note-done" size="featured" tone="neutral" decorative />}
                title={content.engagements.emptyTitle}
                description={content.engagements.emptyBody}
              />
            </Card>
          ) : (
            <ul className={styles.list}>
              {active.map((engagement) => (
                <li key={engagement.engagementId}>
                  <EngagementCard engagement={engagement} content={content} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── J-21/F5/AC-2 — "Past engagements" ────────────────────────── */}
        <section className={styles.block} aria-labelledby="eh-past-engagements-heading">
          <Typography as="h2" id="eh-past-engagements-heading" variant="text-lg" weight="bold">
            {content.engagements.pastHeading}
          </Typography>
          <Typography as="p" variant="text-sm" color="muted">
            {content.engagements.pastDescription}
          </Typography>
          {past.length === 0 ? (
            <Card effect="stroke">
              <EmptyState
                icon={<Icon name="note-01" size="featured" tone="neutral" decorative />}
                title={content.engagements.pastEmptyTitle}
                description={content.engagements.pastEmptyBody}
              />
            </Card>
          ) : (
            <ul className={styles.list}>
              {past.map((engagement) => (
                <li key={engagement.engagementId}>
                  <EngagementCard engagement={engagement} content={content} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>
    </Section>
  );
}
