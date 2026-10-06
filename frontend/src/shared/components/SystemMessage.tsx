import type { ReactNode } from 'react';
import { Button } from '@ds/primitives/Button';
import { Icon } from '@ds/primitives';
import { ItemIcon } from '@ds/composite';
import { Typography } from '@ds/primitives/Typography/Typography';
import { Container, Section } from '@ds/layout';
import styles from './SystemMessage.module.css';

/**
 * Expert Hub system-message page composition — the shared body for the simple
 * chrome pages (unauthorized, not-found, coming-soon). An application-level
 * composition of approved Design System components only (Section, Container,
 * Typography, Button); it introduces no Design System component. Rendered inside
 * a layout's `<main>`, so it owns the page's single `<h1>` and nothing more.
 */
export function SystemMessage({
  eyebrow,
  title,
  titleId,
  body,
  actionLabel,
  actionHref,
  code,
  children,
}: {
  readonly eyebrow?: string;
  readonly title: string;
  readonly titleId: string;
  readonly body: string;
  readonly actionLabel?: string;
  readonly actionHref?: string;
  /**
   * The status this page stands for — `403`, `404` (FADS kit, EH-*-00).
   *
   * ⚠️ Optional, and the ERROR pages pass it. «قريبًا» is not a failure and
   * must not acquire a code or a warning icon just because it shares this
   * composition; a person told their feature is coming should not think
   * something broke.
   */
  readonly code?: string;
  readonly children?: ReactNode;
}) {
  return (
    <Section aria-labelledby={titleId}>
      <Container size="prose">
        <div className={styles.stack} data-tone={code != null ? 'error' : undefined}>
          {code != null && (
            <>
              <ItemIcon
                className={styles.mark}
                icon={<Icon name="alert-diamond" size="featured" tone="error" decorative />}
              />
              {/* Decorative: the title already says what happened, and a
                  screen reader announcing «٤٠٤» before it would be noise. */}
              <Typography
                as="p"
                variant="display-xl"
                weight="bold"
                color="muted"
                aria-hidden="true"
              >
                {code}
              </Typography>
            </>
          )}
          {eyebrow != null && (
            <Typography variant="text-sm" weight="semibold" color="primary">
              {eyebrow}
            </Typography>
          )}
          <Typography as="h1" id={titleId} variant="display-md">
            {title}
          </Typography>
          <Typography as="p" variant="text-lg" color="muted">
            {body}
          </Typography>
          {children}
          {actionHref != null && actionLabel != null && (
            <Button variant="primary" size="lg" href={actionHref}>
              {actionLabel}
            </Button>
          )}
        </div>
      </Container>
    </Section>
  );
}
