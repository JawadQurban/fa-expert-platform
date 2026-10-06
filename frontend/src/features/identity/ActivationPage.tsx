import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Card, ItemIcon, Loading } from '@ds/composite';
import { Button, Icon, Tag, TextInput, Typography } from '@ds/primitives';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import { validateYaqeenInput, type IdentityValidationCode } from './identity.types';
import type {
  ActivationContextDto,
  ActivationResultDto,
  ActivationTokenProblem,
} from './activation.types';
import { getIdentityService, isIdentityProviderNotConfigured } from './identityService';
import { getActivationContent } from './activation.content';
import { getIdentityContent } from './identity.content';
import styles from './ActivationPage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';

/**
 * **J-02/F4 — Nominee Account Activation & Portal Access.**
 *
 * Staff nominated this person (J-02/F1), so an application already exists in
 * their name. This page is how they take ownership of it, and it is **public**:
 * they have no account yet, which is the entire point.
 *
 * The three routes are the server's to choose (AC-1/AC-3), and this page renders
 * whichever it is given:
 *
 * - **Yaqeen** — citizen/resident with no matched account. It calls the *same*
 *   verification J-01 uses, so **AC-2**'s "the same Yaqeen-failure handling from
 *   J-01 applies" is not a coincidence to maintain but a consequence of there
 *   being one implementation.
 * - **Email** — foreigner/GCC. The link reaching their inbox *is* the
 *   verification, so there is nothing further to ask; the page says so rather
 *   than presenting an empty form.
 * - **Existing account** — nothing is verified twice (AC-3).
 *
 * **AC-4 — access does not depend on the screening stage.** The application's
 * status is shown so the nominee knows where things stand, and it gates nothing:
 * there is no branch on it here, and `ActivationResultDto` carries no capability
 * for a later branch to read. The page also says this in words, because someone
 * discovering a mid-screening application in their name will reasonably wonder
 * whether they are allowed in yet.
 *
 * **RB-01 — fails closed.** With no identity provider configured, the link is
 * never resolved and nothing is activated: the page says so and offers sign-in.
 */

type Phase = 'loading' | 'problem' | 'error' | 'unavailable' | 'ready' | 'activated';

/** Maps the token failures to J-02's three distinguishable problems. */
function problemFor(status: number): ActivationTokenProblem {
  if (status === 410) {
    return 'expired';
  }
  return status === 409 ? 'already-used' : 'invalid';
}

export default function ActivationPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getActivationContent(locale), [locale]);
  // Shared with J-01: same validation, same messages.
  const identityContent = useMemo(() => getIdentityContent(locale), [locale]);
  const { token } = useParams();
  const service = getIdentityService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [context, setContext] = useState<ActivationContextDto | null>(null);
  const [result, setResult] = useState<ActivationResultDto | null>(null);
  const [problem, setProblem] = useState<ActivationTokenProblem>('invalid');
  const [reloadKey, setReloadKey] = useState(0);

  const [nationalId, setNationalId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [issues, setIssues] = useState<readonly IdentityValidationCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [yaqeenFailed, setYaqeenFailed] = useState(false);
  const [actionFailed, setActionFailed] = useState(false);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    if (token == null) {
      setProblem('invalid');
      setPhase('problem');
      return;
    }
    void service.getActivationContext(token).then((response) => {
      if (cancelled) {
        return;
      }
      if (response.ok) {
        setContext(response.value);
        setPhase('ready');
      } else if (isIdentityProviderNotConfigured(response.error)) {
        setPhase('unavailable');
      } else if ([404, 409, 410].includes(response.error.status)) {
        setProblem(problemFor(response.error.status));
        setPhase('problem');
      } else {
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, reloadKey]);

  useEffect(() => {
    if (phase === 'ready' || phase === 'activated') {
      document.getElementById('eh-activation-title')?.focus();
    }
  }, [phase]);

  const activate = () => {
    if (token == null || context == null) {
      return;
    }
    setYaqeenFailed(false);
    setActionFailed(false);

    if (context.verification === 'yaqeen') {
      const input = { nationalId, dateOfBirth };
      const found = validateYaqeenInput(input);
      setIssues(found);
      if (found.length > 0) {
        return;
      }
      setBusy(true);
      void service.activateAccount(token, { kind: 'yaqeen', ...input }).then((response) => {
        setBusy(false);
        if (response.ok) {
          setResult(response.value);
          setPhase('activated');
        } else if (response.error.status === 422) {
          // AC-2 — the same failure J-01 shows, for the same reason.
          setYaqeenFailed(true);
        } else {
          setActionFailed(true);
        }
      });
      return;
    }

    setBusy(true);
    void service
      .activateAccount(token, {
        kind: context.verification === 'email' ? 'email' : 'existing-account',
      })
      .then((response) => {
        setBusy(false);
        if (response.ok) {
          setResult(response.value);
          setPhase('activated');
        } else {
          setActionFailed(true);
        }
      });
  };

  /**
   * The validation is J-01's, so the messages are J-01's too — the same rule
   * stated in two different ways would be the defect.
   */
  const errorFor = (code: IdentityValidationCode) =>
    issues.includes(code) ? identityContent.errors[code] : undefined;

  if (phase === 'loading') {
    return (
      <Section aria-label={content.heading}>
        <Container size="prose">
          <Loading variant="skeleton" lines={5} label={content.heading} />
        </Container>
      </Section>
    );
  }

  if (phase === 'problem' || phase === 'error' || phase === 'unavailable') {
    const copy =
      phase === 'problem'
        ? content.problems[problem]
        : phase === 'unavailable'
          ? content.unavailable
          : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={copy.title}
        body={copy.body}
        onRetry={phase === 'error' ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="primary" size="md" href={expertHubPaths.login}>
            {content.existingAccount.submit}
          </Button>
        }
      />
    );
  }

  if (phase === 'activated' && result != null) {
    return (
      <Section aria-labelledby="eh-activation-title">
        <Container size="prose">
          <Card effect="stroke" className={styles.card}>
            <Typography as="h1" id="eh-activation-title" variant="display-md" tabIndex={-1}>
              {content.success.title}
            </Typography>
            <Alert tone="success" role="status">
              {content.success.body}
            </Alert>
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="md"
                href={expertHubPaths.applicationDetail(result.applicationId)}
              >
                {content.success.openApplication}
              </Button>
              <Button variant="secondary" size="md" href={expertHubPaths.home}>
                {content.success.openPortal}
              </Button>
            </div>
          </Card>
        </Container>
      </Section>
    );
  }

  if (context == null) {
    return null;
  }

  return (
    <Section aria-labelledby="eh-activation-title">
      <Container size="prose">
        <Card effect="stroke" className={styles.card}>
          <div className={styles.head}>
            <ItemIcon
              contained
              icon={<Icon name="task-done-01" size="md" tone="primary" decorative />}
            />
            <Typography as="h1" id="eh-activation-title" variant="display-md" tabIndex={-1}>
              {content.heading}
            </Typography>
          </div>

          {/* Someone else started this — say so before asking for anything. */}
          <Typography as="p" variant="text-md">
            {content.intro(context.nomineeName)}
          </Typography>

          <dl className={styles.meta}>
            <div className={styles.metaItem}>
              <dt className={styles.metaTerm}>{content.referenceLabel}</dt>
              <dd className={styles.metaValue}>
                <bdi>{context.applicationReference}</bdi>
              </dd>
            </div>
            <div className={styles.metaItem}>
              <dt className={styles.metaTerm}>{content.statusLabel}</dt>
              <dd className={styles.metaValue}>
                <Tag variant="information" size="sm">
                  {content.statuses[context.applicationStatus]}
                </Tag>
              </dd>
            </div>
          </dl>

          {/* AC-4 — stated, because a mid-screening application invites the
              question "am I allowed in yet?". The answer is yes, always. */}
          <Alert tone="info" role="note">
            {content.accessNote}
          </Alert>

          {actionFailed && (
            <Alert tone="error" role="alert">
              {content.errors.loadBody}
            </Alert>
          )}

          {/* AC-1 — Yaqeen, for a citizen/resident with no matched account. */}
          {context.verification === 'yaqeen' && (
            <div className={styles.form}>
              <Typography as="h2" variant="text-lg" weight="bold">
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
                <Button variant="primary" size="md" disabled={busy} onClick={activate}>
                  {busy ? content.yaqeen.verifying : content.yaqeen.submit}
                </Button>
              </div>
            </div>
          )}

          {/* AC-1 — foreigner/GCC: the link itself was the verification. */}
          {context.verification === 'email' && (
            <div className={styles.form}>
              <Typography as="h2" variant="text-lg" weight="bold">
                {content.email.heading}
              </Typography>
              <Typography as="p" variant="text-md" color="muted">
                {content.email.description}
              </Typography>
              <div>
                <Button variant="primary" size="md" disabled={busy} onClick={activate}>
                  {content.email.submit}
                </Button>
              </div>
            </div>
          )}

          {/* AC-3 — a matched account exists; nothing is verified twice. */}
          {context.verification === 'existing-account' && (
            <div className={styles.form}>
              <Typography as="h2" variant="text-lg" weight="bold">
                {content.existingAccount.heading}
              </Typography>
              <Typography as="p" variant="text-md" color="muted">
                {content.existingAccount.description}
              </Typography>
              <div>
                <Button variant="primary" size="md" disabled={busy} onClick={activate}>
                  {content.existingAccount.submit}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </Container>
    </Section>
  );
}
