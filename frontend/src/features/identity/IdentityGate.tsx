import { useMemo, useState } from 'react';
import { Alert, Card, ItemIcon } from '@ds/composite';
import { Button, Icon, Radio, RadioGroup, TextInput, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import {
  ID_TYPES,
  isBlockedOutcome,
  usesYaqeen,
  validateManualIdentity,
  validateYaqeenInput,
  type IdType,
  type IdentitySessionDto,
  type IdentityValidationCode,
} from './identity.types';
import { getIdentityService, isIdentityProviderNotConfigured } from './identityService';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { getIdentityContent } from './identity.content';
import styles from './IdentityGate.module.css';

/**
 * **J-01's Identity Linking layer** — the prerequisite step before the
 * application form. The journey calls it "a supporting rule set, not a
 * feature… applies as a prerequisite layer before form completion begins", and
 * that is exactly how it is placed: the form does not render until this resolves.
 *
 * It walks J-01's two independent decisions in order:
 *
 * 1. **Which verification path?** (§3A) — the ID-type choice decides whether
 *    Yaqeen applies at all. Foreigners and GCC nationals have no Yaqeen call, so
 *    they are not shown one; the page says why rather than leaving it looking
 *    broken.
 * 2. **Which account outcome?** (§3B, §5) — resolved the moment Yaqeen succeeds
 *    for citizens/residents ("early enough to block duplicates before effort is
 *    wasted"), and deliberately **deferred to submission** for the manual path.
 *
 * Two of the five outcomes stop the applicant, and both **name where to go
 * instead**: an active trainer is sent to add a service (J-03, never a new
 * J-01), and an open application is linked for tracking. A block with no exit
 * is a dead end, and J-01 specifies the exits.
 *
 * ⚠️ Yaqeen and FA.Auth live behind `identityService`; this component
 * never touches either.
 *
 * **RB-01 — fails closed.** When no identity provider is configured, the
 * service refuses every call, and the gate replaces itself with a sign-in
 * prompt. It never shows a verification result it did not receive.
 */
export function IdentityGate({
  onResolved,
}: {
  readonly onResolved: (session: IdentitySessionDto) => void;
}) {
  const { locale } = useLocale();
  const content = useMemo(() => getIdentityContent(locale), [locale]);
  const service = getIdentityService();

  const [idType, setIdType] = useState<IdType | ''>('');
  const [nationalId, setNationalId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fullName, setFullName] = useState('');

  const [issues, setIssues] = useState<readonly IdentityValidationCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [yaqeenFailed, setYaqeenFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [session, setSession] = useState<IdentitySessionDto | null>(null);

  /** A refusal that is not the applicant's to fix is never shown as a mismatch. */
  const failWith = (error: ExpertHubApiError) => {
    if (isIdentityProviderNotConfigured(error)) {
      setUnavailable(true);
    } else {
      setLoadFailed(true);
    }
  };

  const errorFor = (code: IdentityValidationCode) =>
    issues.includes(code) ? content.errors[code] : undefined;

  /** §3B — resolve the account, then hand the whole session up. */
  const resolveAndReport = async (identity: Parameters<typeof service.resolveAccount>[0]) => {
    const resolution = await service.resolveAccount(identity);
    if (!resolution.ok) {
      failWith(resolution.error);
      return;
    }
    // Governing rule 2 — a guest cannot save a draft. `matched-eligible` is the
    // only outcome that links an account without a sign-in.
    const accountLinked = resolution.value.outcome === 'matched-eligible';
    setSession({
      identity,
      resolution: resolution.value,
      accountLinked,
      canSaveDraft: accountLinked,
    });
  };

  const submitYaqeen = async () => {
    const input = { nationalId, dateOfBirth };
    const found = validateYaqeenInput(input);
    setIssues(found);
    if (found.length > 0) {
      return;
    }
    setBusy(true);
    setYaqeenFailed(false);
    setLoadFailed(false);
    const result = await service.verifyWithYaqeen(input);
    if (!result.ok) {
      setBusy(false);
      // §5 row 1 — a failed verification (422) blocks progress with a clear
      // error. Anything else is not a mismatch, and is not reported as one.
      if (result.error.status === 422) {
        setYaqeenFailed(true);
      } else {
        failWith(result.error);
      }
      return;
    }
    await resolveAndReport(result.value);
    setBusy(false);
  };

  const submitManual = async () => {
    const input = { documentNumber, dateOfBirth, fullName };
    const found = validateManualIdentity(input);
    setIssues(found);
    if (found.length > 0) {
      return;
    }
    setBusy(true);
    setLoadFailed(false);
    const result = await service.recordManualIdentity(input);
    if (!result.ok) {
      setBusy(false);
      failWith(result.error);
      return;
    }
    await resolveAndReport(result.value);
    setBusy(false);
  };

  /* ── RB-01 — no provider: sign in instead ───────────────────────────────── */
  if (unavailable) {
    return (
      <Card effect="stroke" className={styles.gate}>
        <Alert tone="warning" surface="tinted" role="alert" title={content.unavailable.title}>
          {content.unavailable.body}
        </Alert>
        <div>
          <Button variant="primary" size="md" href={expertHubPaths.login}>
            {content.guest.signInAction}
          </Button>
        </div>
      </Card>
    );
  }

  /* ── outcome ────────────────────────────────────────────────────────────── */
  if (session != null) {
    const { outcome, existingApplicationId } = session.resolution;

    if (isBlockedOutcome(outcome)) {
      const blocked =
        outcome === 'blocked-trainer'
          ? {
              title: content.outcomes.blockedTrainerTitle,
              body: content.outcomes.blockedTrainerBody,
              action: content.outcomes.blockedTrainerAction,
              // §5 — an accredited trainer goes to J-03, never a new J-01.
              href: expertHubPaths.profile,
            }
          : {
              title: content.outcomes.blockedOpenTitle,
              body: content.outcomes.blockedOpenBody,
              action: content.outcomes.blockedOpenAction,
              href:
                existingApplicationId == null
                  ? expertHubPaths.applications
                  : expertHubPaths.applicationDetail(existingApplicationId),
            };
      return (
        <Card effect="stroke" className={styles.gate}>
          <Alert tone="warning" surface="tinted" role="status" title={blocked.title}>
            {blocked.body}
          </Alert>
          <div>
            <Button variant="primary" size="md" href={blocked.href}>
              {blocked.action}
            </Button>
          </div>
        </Card>
      );
    }

    const proceed =
      outcome === 'matched-eligible'
        ? { title: content.outcomes.matchedTitle, body: content.outcomes.matchedBody }
        : outcome === 'deferred'
          ? { title: content.outcomes.verifiedTitle, body: content.manual.deferredNote }
          : { title: content.outcomes.noMatchTitle, body: content.outcomes.noMatchBody };

    return (
      <Card effect="stroke" className={styles.gate}>
        <Alert tone="success" surface="tinted" role="status" title={proceed.title}>
          {proceed.body}
        </Alert>
        <div>
          <Button variant="primary" size="md" onClick={() => onResolved(session)}>
            {content.outcomes.continueToForm}
          </Button>
        </div>
      </Card>
    );
  }

  /* ── the gate itself ────────────────────────────────────────────────────── */
  return (
    <Card effect="stroke" className={styles.gate}>
      <div className={styles.head}>
        <ItemIcon
          contained
          icon={<Icon name="task-done-01" size="md" tone="primary" decorative />}
        />
        <div>
          <Typography
            as="h2"
            id="eh-identity-heading"
            variant="text-lg"
            weight="bold"
            tabIndex={-1}
          >
            {content.heading}
          </Typography>
          <Typography as="p" variant="text-md" color="muted">
            {content.description}
          </Typography>
        </div>
      </div>

      {/* Governing rule 3 — verification is not eligibility. */}
      <Alert tone="info" role="note">
        {content.verificationNote}
      </Alert>

      <RadioGroup
        legend={content.idTypeLegend}
        value={idType}
        onValueChange={(value) => {
          setIdType(value as IdType);
          setIssues([]);
          setYaqeenFailed(false);
        }}
      >
        {ID_TYPES.map((type) => (
          <Radio
            key={type}
            value={type}
            label={content.idTypes[type]}
            description={content.idTypeHints[type]}
          />
        ))}
      </RadioGroup>

      {idType !== '' && usesYaqeen(idType) && (
        <div className={styles.form}>
          <Typography as="h3" variant="text-md" weight="bold">
            {content.yaqeen.heading}
          </Typography>
          <Typography as="p" variant="text-sm" color="muted">
            {content.yaqeen.description}
          </Typography>
          {yaqeenFailed && (
            <Alert tone="error" role="alert" title={content.yaqeen.failedTitle}>
              {content.yaqeen.failedBody}
            </Alert>
          )}
          <TextInput
            label={content.yaqeen.nationalIdLabel}
            helperText={content.yaqeen.nationalIdHint}
            value={nationalId}
            onChange={(event) => setNationalId(event.target.value)}
            requiredField
            inputMode="numeric"
            errorText={errorFor('national-id-required') ?? errorFor('national-id-format')}
          />
          <TextInput
            label={content.yaqeen.dobLabel}
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            requiredField
            errorText={errorFor('dob-required')}
          />
          <div>
            <Button variant="primary" size="md" disabled={busy} onClick={() => void submitYaqeen()}>
              {busy ? content.yaqeen.verifying : content.yaqeen.submit}
            </Button>
          </div>
        </div>
      )}

      {idType !== '' && !usesYaqeen(idType) && (
        <div className={styles.form}>
          <Typography as="h3" variant="text-md" weight="bold">
            {content.manual.heading}
          </Typography>
          {/* §3A — say that no Yaqeen path exists here, so its absence is a rule. */}
          <Alert tone="info" role="note">
            {content.manual.description}
          </Alert>
          <TextInput
            label={content.manual.documentNumberLabel}
            helperText={content.manual.documentNumberHint}
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value)}
            requiredField
            errorText={errorFor('document-number-required')}
          />
          <TextInput
            label={content.manual.dobLabel}
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            requiredField
            errorText={errorFor('dob-required')}
          />
          <TextInput
            label={content.manual.fullNameLabel}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            requiredField
            errorText={errorFor('full-name-required')}
          />
          <div>
            <Button variant="primary" size="md" disabled={busy} onClick={() => void submitManual()}>
              {content.manual.submit}
            </Button>
          </div>
        </div>
      )}

      {loadFailed && (
        <Alert tone="error" role="alert">
          {content.loadError}
        </Alert>
      )}
    </Card>
  );
}
