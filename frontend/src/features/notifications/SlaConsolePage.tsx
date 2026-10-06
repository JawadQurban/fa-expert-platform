import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Loading } from '@ds/composite';
import { Button, NumberInput, Select, Tag, TextInput, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { getNotificationService } from './notificationService';
import { getNotificationsContent } from './notifications.content';
import { NotificationsAreaNav } from './NotificationsAreaNav';
import {
  SLA_UNITS,
  validateSla,
  type SlaInput,
  type SlaMatrixRowDto,
  type SlaUnit,
  type SlaValidationCode,
} from './notification.types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { getAccessContent } from '../access/access.content';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './NotificationsPage.module.css';
import { numberFormatter } from '../../shared/formatting';

/**
 * EH-INT-13 — the central deadline console (**CAP-07 / `F-0704`**), at
 * `/expert-hub/internal/sla`.
 *
 * `US-0704`: "a deadline-management screen gathering every deadline and reminder
 * used across the twelve capabilities, so I edit them from one place without
 * going back to each capability." `BR-0705` makes that exclusive: a deadline is
 * changed here or nowhere.
 *
 * ⚠️ `DM-GAP-10` is the deadline *durations*, and the honest answer is not an
 * empty table. Three deadlines are stated by approved journeys and the product
 * already runs them — shipping those blank would have discarded approved rules.
 * Three more are named by a journey that explicitly leaves the number open, and
 * they appear with **no duration**, which is the gap made visible rather than
 * described. Nothing is assumed in either direction.
 *
 * A row whose deadline lives on the record (J-12: the agreement's own expiry
 * date) configures only its reminders — there is no duration field to fill in,
 * because a fixed number there would have been invented.
 */

type Phase = 'loading' | 'error' | 'ready';

function parseOffsets(text: string): readonly number[] {
  return text
    .split(/[,،\s]+/)
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value));
}

export default function SlaConsolePage() {
  const { locale } = useLocale();
  const capabilityNames = getAccessContent(locale).matrix.capabilityNames;
  const content = useMemo(() => getNotificationsContent(locale), [locale]);
  const copy = content.sla;
  const service = getNotificationService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [rows, setRows] = useState<readonly SlaMatrixRowDto[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState<SlaUnit>('days');
  const [reminders, setReminders] = useState('');
  const [issues, setIssues] = useState<readonly SlaValidationCode[]>([]);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void service.listSlaRows().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setLoadError(result.error);
        setPhase('error');
        return;
      }
      setRows(result.value);
      setPhase('ready');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-sla-title')?.focus();
    }
  }, [phase]);

  if (phase === 'loading') {
    return (
      <WorkspacePage label={copy.title}>
        <Loading variant="skeleton" lines={5} label={copy.title} />
      </WorkspacePage>
    );
  }

  // A denial is not a load failure: `P-190`'s gate answers 403 with the
  // feature it wanted, and telling someone their system broke sends them
  // to the wrong person for help.
  const failure = describeLoadFailure(loadError, locale, {
    title: content.errors.loadTitle,
    body: content.errors.loadBody,
  });

  if (phase === 'error') {
    return (
      <PageLoadError
        title={failure.title}
        body={failure.body}
        onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
      />
    );
  }

  const numbers = numberFormatter(locale);
  const withDuration = rows.filter((row) => row.status !== 'undefined-duration').length;

  const openEditor = (row: SlaMatrixRowDto) => {
    setIssues([]);
    setEditing(row.slaId);
    setDuration(row.status === 'fixed' ? row.duration : undefined);
    setUnit(row.status === 'fixed' ? row.unit : 'days');
    setReminders(
      row.status === 'undefined-duration' ? '' : row.reminderOffsets.map(String).join(', ')
    );
  };

  const save = (row: SlaMatrixRowDto) => {
    const offsets = parseOffsets(reminders);
    // A record-derived deadline keeps its shape: it configures reminders only,
    // because the deadline itself is the record's date (J-12).
    const input: SlaInput =
      row.status === 'record-derived'
        ? { kind: 'reminders-only', reminderOffsets: offsets }
        : { kind: 'fixed', duration: duration ?? 0, unit, reminderOffsets: offsets };
    const found = validateSla(input);
    setIssues(found);
    if (found.length > 0) {
      return;
    }
    setFailed(false);
    void service.setSla(row.slaId, input).then((result) => {
      if (!result.ok) {
        setFailed(true);
        return;
      }
      setRows(result.value);
      setEditing(null);
    });
  };

  return (
    <WorkspacePage labelledBy="eh-sla-title">
      <NotificationsAreaNav content={content} current="sla" />

      <PageHead
        titleId="eh-sla-title"
        title={copy.title}
        lead={copy.intro}
        /* `DM-GAP-10` — stated as a count, so the gap is a number not a mood. */
        summary={copy.coverageNote(withDuration, rows.length)}
      />

      {failed && (
        <Alert tone="error" surface="tinted" role="alert">
          {content.errors.actionFailed}
        </Alert>
      )}

      <Panel
        flush
        toolbar={
          /* `BR-0705` — why this screen is the only place a deadline changes. */
          <Typography as="p" variant="text-xs" color="muted">
            {copy.centralNote}
          </Typography>
        }
      >
        <ul className={styles.consoleRows}>
          {rows.map((row) => (
            <li key={row.slaId} className={styles.consoleRow}>
              <div className={styles.rowHead}>
                <Typography as="h2" variant="text-sm" weight="bold">
                  {locale === 'ar' ? row.nameAr : row.nameEn}
                </Typography>
                <Tag variant="neutral" size="xs">
                  {row.capabilityCode == null
                    ? copy.noCapability
                    : (capabilityNames[row.capabilityCode] ?? row.capabilityCode)}
                </Tag>
                <span className={styles.rowStatus}>
                  {row.status === 'undefined-duration' ? (
                    <Tag variant="warning" size="sm">
                      {copy.undefinedDuration}
                    </Tag>
                  ) : row.status === 'fixed' ? (
                    <Tag variant="success" size="sm">
                      {copy.durationValue(row.duration, content.sla.units[row.unit])}
                    </Tag>
                  ) : (
                    <Tag variant="information" size="sm">
                      {copy.recordDerived}
                    </Tag>
                  )}
                </span>
              </div>

              <div className={styles.evidence}>
                <Typography as="span" variant="text-xs" color="muted">
                  {copy.sourceLabel} — {row.source}
                </Typography>
                <Typography as="span" variant="text-sm">
                  <bdi>
                    {copy.onBreachLabel}: {locale === 'ar' ? row.onBreachAr : row.onBreachEn}
                  </bdi>
                </Typography>
              </div>

              <Typography as="p" variant="text-xs" color="muted">
                {row.status !== 'undefined-duration' && row.reminderOffsets.length > 0
                  ? copy.remindersValue(
                      row.reminderOffsets.map((offset) => numbers.format(offset)).join('، ')
                    )
                  : copy.noReminders}
              </Typography>

              {editing === row.slaId ? (
                <div className={styles.editor}>
                  <Typography as="h3" variant="text-sm" weight="bold">
                    {copy.editorHeading(locale === 'ar' ? row.nameAr : row.nameEn)}
                  </Typography>
                  {/* No duration field for a record-derived deadline: the record
                      carries the date, and only the reminders are set here. */}
                  {row.status !== 'record-derived' && (
                    <div className={styles.filters}>
                      <NumberInput
                        label={copy.durationLabel}
                        min={1}
                        value={duration}
                        onValueChange={setDuration}
                        errorText={
                          issues.includes('duration-positive')
                            ? content.errors.durationPositive
                            : undefined
                        }
                      />
                      <Select
                        label={copy.unitLabel}
                        value={unit}
                        onValueChange={(value) => setUnit(value as SlaUnit)}
                        options={SLA_UNITS.map((value) => ({
                          value,
                          label: content.sla.units[value],
                        }))}
                      />
                    </div>
                  )}
                  <TextInput
                    label={copy.remindersLabel}
                    helperText={copy.remindersHelp}
                    value={reminders}
                    onChange={(event) => setReminders(event.target.value)}
                    errorText={
                      issues.includes('reminder-positive')
                        ? content.errors.reminderPositive
                        : issues.includes('reminder-within-duration')
                          ? content.errors.reminderWithinDuration
                          : undefined
                    }
                  />
                  <div className={styles.actions}>
                    <Button variant="primary" size="sm" onClick={() => save(row)}>
                      {copy.save}
                    </Button>
                    <Button variant="tertiary" size="sm" onClick={() => setEditing(null)}>
                      {copy.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.actions}>
                  <Button variant="secondary" size="sm" onClick={() => openEditor(row)}>
                    {copy.edit(locale === 'ar' ? row.nameAr : row.nameEn)}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </WorkspacePage>
  );
}
