import { ItemIcon } from '@ds/composite';
import { Icon, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ProfileContent } from '../profile.content';
import type { AcademyCertificationDto, AcademyEducationDto } from '../profile.types';
import styles from './AcademyRecordList.module.css';
import { formatDate as formatLocaleDate } from '../../../shared/formatting';

/**
 * The Academy's further records — the ones the form's single set of fields
 * could not hold.
 *
 * ⚠️ **Not a second copy of what is already on screen.** The entry showing in
 * «نوع المؤهل» and the fields beside it is excluded server-side, so nothing
 * appears twice (`P-265`). This renders only when there is genuinely more.
 *
 * Read-only, and it says so: FAST masters these (`BR-1201`) and the trainer
 * maintains them in the Academy's own portal. There is no endpoint here that
 * edits one, so the page must not look like there is.
 */
export function AcademyRecordList({
  education,
  certifications,
  syncedAt,
  content,
  locale,
}: {
  readonly education: readonly AcademyEducationDto[];
  readonly certifications: readonly AcademyCertificationDto[];
  readonly syncedAt: string | null;
  readonly content: ProfileContent;
  readonly locale: Locale;
}) {
  const copy = content.academyRecords;

  // Nothing beyond the fields — which is the common case, and says nothing is
  // wrong. An empty heading would be noise.
  if (education.length === 0 && certifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.stack}>
      <div>
        {/* ⚠️ NOT a heading. This sits inside a `<fieldset>` that its own
            `<legend>` already labels, and the nearest real heading is the
            section title two levels up — an `<h4>` here skips a level, which
            `heading-order` caught. A bold label says the same thing to a
            sighted reader without lying about the document outline. */}
        <Typography as="p" variant="text-sm" weight="bold">
          {copy.heading}
        </Typography>
        <Typography as="p" variant="text-xs" color="muted">
          {syncedAt == null ? copy.description : copy.dated(formatDate(syncedAt, locale))}
        </Typography>
      </div>

      <ul className={styles.list}>
        {education.map((item, index) => (
          <li key={`edu-${index}`} className={styles.item}>
            <ItemIcon
              contained
              icon={<Icon name="notebook" size="md" tone="primary" decorative />}
            />
            <div className={styles.body}>
              <Typography as="span" variant="text-sm" weight="bold">
                <bdi>{item.qualification ?? copy.unnamed}</bdi>
              </Typography>
              <Typography as="span" variant="text-xs" color="muted">
                <bdi>
                  {[item.specialization, item.institution ?? copy.unknownInstitution]
                    .filter((part) => part != null && part !== '')
                    .join(' — ')}
                </bdi>
              </Typography>
              {/* ⚠️ Its own element, never interpolated beside other text:
                  a date and a label in one bidi run reorders into nonsense
                  in Arabic (`D-21`). */}
              {item.obtainedAt != null && (
                <time className={styles.meta} dateTime={item.obtainedAt}>
                  {formatDate(item.obtainedAt, locale)}
                </time>
              )}
            </div>
          </li>
        ))}

        {certifications.map((item, index) => (
          <li key={`cert-${index}`} className={styles.item}>
            <ItemIcon
              contained
              icon={<Icon name="task-done-01" size="md" tone="primary" decorative />}
            />
            <div className={styles.body}>
              <Typography as="span" variant="text-sm" weight="bold">
                <bdi>{item.name ?? copy.unnamed}</bdi>
              </Typography>
              <Typography as="span" variant="text-xs" color="muted">
                <bdi>{item.institution ?? copy.unknownInstitution}</bdi>
              </Typography>
              {item.obtainedAt != null && (
                <time className={styles.meta} dateTime={item.obtainedAt}>
                  {formatDate(item.obtainedAt, locale)}
                </time>
              )}
              {/* The document's name, not a link to it — see the note on the
                  wire. A link that answers 401 is worse than a file name,
                  because the reader cannot tell whether the document is
                  missing or they are. */}
              {item.fileName != null && (
                <Typography as="span" variant="text-xs" color="muted">
                  <bdi>{item.fileName}</bdi>
                </Typography>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Typography as="p" variant="text-xs" color="muted">
        {copy.editElsewhere}
      </Typography>
    </div>
  );
}

/** The reader's own calendar — Hijri in Arabic, as everywhere else here. */
function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    dateStyle: 'medium',
  });
}
