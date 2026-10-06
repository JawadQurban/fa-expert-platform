import { Alert } from '@ds/composite';
import { Avatar, Button, Icon, Typography } from '@ds/primitives';
import { missingIdentityCardFields, type IdentityCardDto } from '../trainerSearch.types';
import type { TrainerSearchContent } from '../trainerSearch.content';
import { apiUrl } from '../../../shared/services/apiClient';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './IdentityCardPanel.module.css';

/**
 * **J-15/F2 — the Identity Card.**
 *
 * F2/AC-1 is unusually prescriptive: the card is "populated directly from the
 * Trainer Profile fields **per the matrix above, with no additional content or
 * custom wording**". So this component renders the matrix's seven rows, in the
 * matrix's order, and offers no slot for an eighth — the constraint is the
 * feature, not a limitation to work around.
 *
 * ⚠️ **Every row comes from the trainer profile** — *Related Fields*
 * from the field/domain answer, *Social Media Accounts* from the LinkedIn and
 * website links. A row the API sends as `null` (no source) still renders as
 * explicitly unavailable rather than being dropped, so a gap is never hidden.
 *
 * ⚠️ **PDF export is blocked.** `G26` leaves document generation and storage
 * unresolved, and the "approved design template" AC-1 requires is not in this
 * repository. Rendering a client-side PDF would produce a document in the wrong
 * design, which is worse than none — so the action is disabled and says why.
 */
/**
 * The Experience row. The profile holds it as free text, so it is shown as
 * written; only a purely numeric value reads as a number of years. Parsing free
 * text as a number would render "NaN".
 */
function experienceText(experience: string, content: TrainerSearchContent): string {
  const trimmed = experience.trim();
  return /^[0-9]+$/.test(trimmed) ? content.yearsValue(Number(trimmed)) : trimmed;
}

export function IdentityCardPanel({
  card,
  content,
}: {
  readonly card: IdentityCardDto;
  readonly content: TrainerSearchContent;
}) {
  const copy = content.identityCard;
  const missing = missingIdentityCardFields(card);
  const missingLabels = missing
    .filter((field) => field !== 'photo')
    .map((field) => copy.fields[field as 'relatedFields' | 'socialAccounts']);

  /**
   * One matrix row. `null` ⇒ the platform has nowhere to store it — which is a
   * different statement from an empty list, and is reported as such.
   *
   * The list check is a hand-written guard rather than `Array.isArray`, which
   * widens a `readonly string[]` to `any[]` and loses the element type.
   */
  const isList = (value: readonly string[] | string): value is readonly string[] =>
    typeof value !== 'string';

  const row = (label: string, value: readonly string[] | string | null) => (
    <div key={label} className={styles.row}>
      <dt className={styles.term}>{label}</dt>
      <dd className={styles.value}>
        {value == null ? (
          <span className={styles.missing}>
            <Icon name="note-01" size="sm" tone="primary" decorative />
            <Typography as="span" variant="text-sm" color="muted">
              {copy.missingSource}
            </Typography>
          </span>
        ) : isList(value) ? (
          <ul className={styles.list}>
            {value.map((entry) => (
              <li key={entry}>
                <bdi>{entry}</bdi>
              </li>
            ))}
          </ul>
        ) : (
          <bdi>{value}</bdi>
        )}
      </dd>
    </div>
  );

  return (
    <Panel>
      <Typography as="h2" variant="text-md" weight="bold">
        {copy.heading}
      </Typography>
      <Typography as="p" variant="text-sm" color="muted">
        {copy.description}
      </Typography>

      <div className={styles.photoRow}>
        <Avatar
          name={card.name}
          src={card.photoUrl == null ? undefined : apiUrl(card.photoUrl)}
          size="xl"
          border
          decorative
        />
        <Typography as="p" variant="text-md" weight="bold">
          {card.name}
        </Typography>
      </div>

      {/* The seven matrix rows, in the matrix's order. */}
      <dl className={styles.rows}>
        {row(copy.fields.experience, experienceText(card.experience, content))}
        {row(copy.fields.academicQualifications, card.academicQualifications)}
        {row(copy.fields.relatedFields, card.relatedFields)}
        {row(copy.fields.certifications, card.certifications)}
        {row(copy.fields.socialAccounts, card.socialAccounts)}
      </dl>

      {/* `Q19` — name the gaps once, for the person who can report them. */}
      {missingLabels.length > 0 && (
        <Alert tone="warning" surface="tinted" role="note">
          {copy.missingList(missingLabels.join('، '))}
        </Alert>
      )}

      {card.pdfUrl == null ? (
        <>
          <div>
            <Button variant="secondary" size="md" disabled>
              {copy.export}
            </Button>
          </div>
          {/* `G26` — say why, rather than leaving a dead control. */}
          <Alert tone="info" surface="tinted" role="note">
            {copy.exportUnavailable}
          </Alert>
        </>
      ) : (
        <div>
          <Button
            variant="secondary"
            size="md"
            href={card.pdfUrl}
            iconStart={<Icon name="download-01" size="sm" decorative />}
          >
            {copy.export}
          </Button>
        </div>
      )}
    </Panel>
  );
}
