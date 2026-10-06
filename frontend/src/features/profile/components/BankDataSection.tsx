import { useId, useRef, useState } from 'react';
import { Alert } from '@ds/composite';
import { Button, TextInput, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ProfileContent } from '../profile.content';
import {
  BANK_DATA_FIELD_ORDER,
  EMPTY_BANK_DATA,
  invalidBankDataFields,
  validateBankData,
} from '../profile.types';
import type {
  BankDataFieldId,
  BankDataFields,
  BankDataFormatFieldId,
  ProfileBankDataDto,
} from '../profile.types';
import styles from './BankDataSection.module.css';
import { formatDate } from '../../../shared/formatting';

/**
 * J-09/F6 — the Bank Data section that **opens after preliminary approval**
 * (AC-2), carrying the eight mandatory fields listed in AC-3.
 *
 * Three journey details are honoured literally:
 * - The section is **not part of the original application form** — it appears on
 *   the profile only once `state !== 'not-requested'`, so a trainer who has not
 *   been asked never sees it.
 * - **All eight fields are mandatory** (AC-3); `validateBankData` is the gate and
 *   reports every missing field at once rather than one at a time.
 * - Saving is what unblocks the creator (AC-4), so the completed state says so
 *   rather than just showing a tick.
 */
export function BankDataSection({
  bankData,
  content,
  locale,
  saving,
  onSave,
}: {
  readonly bankData: ProfileBankDataDto;
  readonly content: ProfileContent;
  readonly locale: Locale;
  readonly saving: boolean;
  readonly onSave: (fields: BankDataFields) => void;
}) {
  const copy = content.bankData;
  const sectionId = useId();
  const errorsRef = useRef<HTMLDivElement>(null);

  /*
   * The Academy already holds these eight fields for most people (`P-229`), so
   * the form starts from what it knows and asks the trainer to check it. Asking
   * somebody to retype an IBAN that is already on file is both a poor journey
   * and the likeliest way a payment instruction acquires a typo.
   *
   * ⚠️ Nothing is saved by pre-filling: `AC-4` acts on what they confirm with
   * the button, and until then this is only a suggestion on screen.
   */
  const suggested = bankData.fields == null ? (bankData.suggested ?? null) : null;
  const [fields, setFields] = useState<BankDataFields>(
    bankData.fields ?? { ...EMPTY_BANK_DATA, ...(suggested ?? {}) }
  );
  const [missing, setMissing] = useState<readonly BankDataFieldId[]>([]);
  const [invalid, setInvalid] = useState<readonly BankDataFormatFieldId[]>([]);
  const prefilled = suggested != null && Object.keys(suggested).length > 0;

  const complete = bankData.state === 'complete';

  const handleSave = () => {
    const found = validateBankData(fields);
    const malformed = invalidBankDataFields(fields);
    setMissing(found);
    setInvalid(malformed);
    if (found.length > 0 || malformed.length > 0) {
      errorsRef.current?.focus();
      return;
    }
    onSave(fields);
  };

  const errorFor = (id: BankDataFieldId): string | undefined => {
    if (missing.includes(id)) {
      return copy.requiredError;
    }
    const format = invalid.find((entry) => entry === id);
    return format == null ? undefined : copy.formatErrors[format];
  };
  const flagged = BANK_DATA_FIELD_ORDER.filter((id) => errorFor(id) != null);

  if (complete && bankData.fields != null) {
    const saved = bankData.fields;
    return (
      <div className={styles.wrapper}>
        <Alert tone="success" title={copy.completeTitle} role="status">
          {copy.completeBody}
        </Alert>
        <dl className={styles.summary}>
          {BANK_DATA_FIELD_ORDER.map((id) => (
            <div key={id} className={styles.summaryRow}>
              <dt>
                <Typography as="span" variant="text-sm" color="muted">
                  {copy.fields[id]}
                </Typography>
              </dt>
              <dd>
                <Typography as="span" variant="text-md">
                  <bdi>{saved[id]}</bdi>
                </Typography>
              </dd>
            </div>
          ))}
        </dl>
        {bankData.completedAt != null && (
          <Typography as="p" variant="text-sm" color="muted">
            {copy.completedAt(
              formatDate(new Date(bankData.completedAt), locale, {
                dateStyle: 'medium',
              })
            )}
          </Typography>
        )}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* AC-1 — the preliminary-approval prompt that opened this section. */}
      <Alert tone="info" title={copy.requestedTitle} role="status">
        {copy.requestedBody}
      </Alert>

      {/* Said plainly: these values came from somewhere, and they are the
          trainer's to correct. Silence would present the Academy's record as
          their own entry. */}
      {prefilled && (
        <Alert tone="info" title={copy.prefilledTitle} role="status">
          {copy.prefilledBody}
        </Alert>
      )}

      <div className={styles.grid}>
        {BANK_DATA_FIELD_ORDER.map((id) => (
          <TextInput
            key={id}
            label={copy.fields[id]}
            value={fields[id]}
            onChange={(event) => {
              setFields((current) => ({ ...current, [id]: event.target.value }));
              setMissing((current) => current.filter((entry) => entry !== id));
              setInvalid((current) => current.filter((entry) => entry !== id));
            }}
            requiredField
            errorText={errorFor(id)}
          />
        ))}
      </div>

      {flagged.length > 0 && (
        <div
          ref={errorsRef}
          className={styles.errors}
          role="alert"
          tabIndex={-1}
          aria-labelledby={`${sectionId}-errors`}
        >
          <Typography as="h4" id={`${sectionId}-errors`} variant="text-md" weight="bold">
            {copy.errorsHeading}
          </Typography>
          <ul className={styles.errorList}>
            {flagged.map((id) => (
              <li key={id}>{copy.fields[id]}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Button variant="primary" size="md" onClick={handleSave} disabled={saving}>
          {copy.save}
        </Button>
      </div>
    </div>
  );
}
