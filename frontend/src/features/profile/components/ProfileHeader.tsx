import { Rating } from '@ds/composite';
import { Avatar, Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import brandPattern from '@/assets/icons/background pattern.svg';
import type { ProfileContent } from '../profile.content';
import type { MyProfileDto } from '../profile.types';
import styles from './ProfileHeader.module.css';
import { formatNumber } from '../../../shared/formatting';

/**
 * P-10 Profile Header — a branded **pattern hero** (marketing composition, tokens
 * only) carrying identity: avatar (photo via `avatarUrl`, else initials — a clean
 * built-in placeholder), name (the page H1), classification, the calculated
 * overall rating (`02D`, P-06), and the read-only SSO email. Creativity is
 * composition-only per CLAUDE.md — no new DS parts/tokens/colors.
 */
export function ProfileHeader({
  profile,
  content,
  locale,
}: {
  readonly profile: MyProfileDto;
  readonly content: ProfileContent;
  readonly locale: Locale;
}) {
  const formatScore = (value: number) =>
    formatNumber(value, locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const rated = profile.ratings.state === 'calculated' && profile.ratings.overall != null;

  return (
    <div className={styles.hero} style={{ backgroundImage: `url("${brandPattern}")` }}>
      <div className={styles.heroInner}>
        <Avatar
          name={profile.displayName}
          src={profile.avatarUrl ?? undefined}
          size="2xl"
          border
          decorative
        />
        <div className={styles.identity}>
          <span className={styles.eyebrow}>{content.title}</span>
          <Typography as="h1" id="eh-profile-title" variant="display-md" tabIndex={-1}>
            {profile.displayName}
          </Typography>
          <div className={styles.meta}>
            {/* See the note in `LockedFactsSection` — same rule, same reason. */}
            <Tag variant={profile.classification == null ? 'neutral' : 'information'} size="md">
              {profile.classification == null
                ? content.header.notAccredited
                : content.classifications[profile.classification]}
            </Tag>
            {rated && profile.ratings.overall != null && (
              <span className={styles.rating}>
                <Rating
                  value={profile.ratings.overall}
                  size="sm"
                  brand
                  label={content.header.ratingAria(profile.ratings.overall)}
                />
                <span className={styles.ratingScore}>{formatScore(profile.ratings.overall)}</span>
              </span>
            )}
          </div>
          <span className={styles.email}>
            <span className={styles.emailLabel}>{content.header.emailLabel}:</span>{' '}
            <bdi>{profile.email}</bdi>
          </span>
        </div>
      </div>
    </div>
  );
}
