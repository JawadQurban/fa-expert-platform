import { useEffect, useState } from 'react';
import { Typography } from '@ds/primitives/Typography/Typography';
import { Container } from '@ds/layout';
import type { Locale } from '@/types';
import type { HeaderContent } from '../content/header.content';
import { formatDate } from '../formatting';
import styles from './ServiceInformationBar.module.css';

/**
 * Level 2 of the Expert Hub header — the service information bar. A thin strip
 * carrying at-a-glance service context, RTL-first.
 *
 * An application-level composition of approved Design System primitives
 * (`Typography`, `Container`) — not a Design System component, no new token.
 *
 * ⚠️ <b>It used to read «3 September 2024 · 2:30 PM · Riyadh · Cloudy», hard
 * coded, on a live government site in September 2026</b> (`D-22`). A frozen
 * date is worse than no date: it tells every visitor the site is abandoned.
 *
 * The split is by what we actually have a source for. <b>Date and time are
 * real</b> — the visitor's own clock, formatted for their locale, refreshed
 * every minute so a tab left open does not drift back into the same defect.
 * <b>Weather and location are not</b>: there is no feed for either, and a
 * plausible-looking figure with no source behind it is an invention on a
 * government header. They are gone until something can supply them, and
 * `service.items` remains as the seam that would carry them.
 *
 * The Saudi accessibility/utility icon cluster shown on the reference site is
 * deliberately omitted for now: those glyphs are not in the approved icon
 * registry and their behaviours (text-to-speech, zoom, …) are out of scope — the
 * end slot is left open so an approved implementation can be dropped in later
 * without a missing-icon fallback.
 */
export function ServiceInformationBar({
  service,
  locale,
}: {
  readonly service: HeaderContent['service'];
  readonly locale: Locale;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Every minute: enough for a clock showing hours and minutes, and cheap
    // enough to leave running on a page somebody keeps open all day.
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const date = formatDate(now, locale, { dateStyle: 'long' });
  const time = formatDate(now, locale, { timeStyle: 'short' });
  // `YYYY-MM-DD` for the date element — a machine-readable date, not an instant.
  const dateOnly = now.toISOString().slice(0, 10);

  return (
    <div className={styles.bar}>
      <Container>
        <div className={styles.inner}>
          <div className={styles.info}>
            {/*
              ⚠️ Date and time are TWO items, not one string with a separator.
              «٩ سبتمبر ٢٠٢٦ · ٣:٣٠ م» in one element puts Arabic-Indic digits
              either side of neutral characters, and the bidi algorithm
              reorders them into «سبتمبر ٣١٢٠٢٦ م» — the numbers run together
              and the result is unreadable. Two elements cannot interleave, and
              the bar already draws its own divider between items.
            */}
            <span className={styles.item}>
              <Typography as="span" variant="text-sm" color="muted">
                {/* A <time> element, because it is one. */}
                <time dateTime={dateOnly}>{date}</time>
              </Typography>
            </span>
            <span className={styles.item}>
              <Typography as="span" variant="text-sm" color="muted">
                <time dateTime={now.toISOString()}>{time}</time>
              </Typography>
            </span>
            {service.items.map((item) => (
              <span key={item.id} className={styles.item}>
                <Typography as="span" variant="text-sm" color="muted">
                  {item.label}
                </Typography>
              </span>
            ))}
          </div>
          {/* Accessibility/utility cluster slot — intentionally empty (pending). */}
          <div className={styles.utilities} aria-hidden="true" />
        </div>
      </Container>
    </div>
  );
}
