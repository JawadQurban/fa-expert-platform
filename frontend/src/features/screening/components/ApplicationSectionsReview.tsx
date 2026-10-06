import { Accordion } from '@ds/composite';
import type { AccordionItem } from '@ds/composite';
import { Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ScreeningContent } from '../screening.content';
import type { ScreeningSectionDto } from '../screening.types';
import styles from './ApplicationSectionsReview.module.css';

/**
 * J-05/F2/AC-2 — the screening manager navigates the form's sections and
 * reviews **each field individually**. Rendered as an `Accordion` so a long
 * multi-section application stays navigable without losing the decision panel
 * off-screen; the first section is expanded by default.
 *
 * Fields inside the AI analysis scope carry a visible marker so the manager can
 * see which answers the advisory panel read (J-05/F4/AC-1) — the marker is
 * informational and never changes the field's own weight in the score.
 */
function SectionFields({
  section,
  content,
  locale,
}: {
  readonly section: ScreeningSectionDto;
  readonly content: ScreeningContent;
  readonly locale: Locale;
}) {
  return (
    <dl className={styles.fields}>
      {section.fields.map((field) => (
        <div key={field.id} className={styles.field}>
          <dt className={styles.term}>
            <Typography as="span" variant="text-sm" color="muted">
              {field.label[locale] ?? field.label.ar}
            </Typography>
            {field.qualitative === true && (
              <Tag variant="information" size="sm" outline>
                {content.form.qualitativeTag}
              </Tag>
            )}
          </dt>
          <dd className={styles.definition}>
            {field.value.trim() === '' ? (
              <Typography as="span" variant="text-md" color="muted">
                {content.form.emptyValue}
              </Typography>
            ) : (
              <Typography as="span" variant="text-md">
                {field.value}
              </Typography>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ApplicationSectionsReview({
  sections,
  content,
  locale,
}: {
  readonly sections: readonly ScreeningSectionDto[];
  readonly content: ScreeningContent;
  readonly locale: Locale;
}) {
  const items: AccordionItem[] = sections.map((section) => ({
    id: section.id,
    title: section.title[locale] ?? section.title.ar,
    content: <SectionFields section={section} content={content} locale={locale} />,
  }));

  return (
    <Accordion items={items} defaultExpandedId={sections[0]?.id} label={content.form.heading} />
  );
}
