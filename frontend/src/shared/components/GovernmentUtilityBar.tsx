import { Typography } from '@ds/primitives/Typography/Typography';
import { Link } from '@ds/primitives/Link';
import { Container } from '@ds/layout';
import type { HeaderContent } from '../content/header.content';
import styles from './GovernmentUtilityBar.module.css';

/**
 * Level 1 of the Expert Hub header — the government utility bar. A thin top strip
 * carrying the Saudi "registered government website" indicator and a "how to
 * verify?" affordance, RTL-first.
 *
 * An application-level composition of approved Design System primitives
 * (`Typography`, `Link`, `Container`) — it is **not** a Design System component
 * and introduces no token. All copy comes from `header.content.ts`.
 *
 * The verification URL is **pending confirmation** (`gov.verifyHref === null`):
 * until the official link is supplied, the affordance renders as a clearly
 * non-navigable, disabled `Link` rather than pointing at a guessed URL. Supplying
 * `verifyHref` turns it into a live external link with no code change.
 */
export function GovernmentUtilityBar({ gov }: { readonly gov: HeaderContent['gov'] }) {
  const pending = gov.verifyHref == null;
  return (
    <div className={styles.bar}>
      <Container>
        <div className={styles.inner}>
          <Typography as="span" variant="text-sm" color="muted">
            {gov.indicator}
          </Typography>
          <Link href={gov.verifyHref ?? undefined} external={!pending} disabled={pending} size="sm">
            {gov.verifyLabel}
          </Link>
        </div>
      </Container>
    </div>
  );
}
