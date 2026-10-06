import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, EmptyState, Loading } from '@ds/composite';
import { Avatar, Button, Icon, Select, Tag, TextInput, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { getAccessService } from './accessService';
import { getAccessContent, type AccessContent } from './access.content';
import { AccessAreaNav } from './AccessAreaNav';
import {
  ROLE_CODES,
  SCOPED_ROLE,
  validateAssignRole,
  type AccessAuditEntryDto,
  type AccessValidationCode,
  type AssignRoleInput,
  type CentreDto,
  type FastProfileDto,
  type RoleCode,
  type UserAccessDto,
} from './access.types';
import styles from './AccessPage.module.css';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import { dateFormatter } from '../../shared/formatting';

/**
 * EH-INT-14 — users and the roles they hold (**CAP-08 / `F-0802`**), at
 * `/expert-hub/internal/access/users`.
 *
 * `US-0802`: "assign one or more roles to each user, so everyone reaches what
 * their work needs and no more."
 *
 * The screen grants **roles, never permissions** — `BR-0801`. There is no
 * control here that names a permission, because the service has no operation
 * that would accept one.
 *
 * The centre coordinator is the one role §8.8.5 scopes to a single centre, and
 * the form mirrors the type union that encodes it: choosing that role reveals a
 * required centre, and choosing any other hides it. A coordinator without a
 * centre cannot be submitted, because `AssignRoleInput` cannot express one.
 */

type Phase = 'loading' | 'error' | 'ready';

/**
 * What the Financial Academy already knows about this person, shown beside the
 * roles Expert Hub grants them.
 *
 * ⚠️ **It grants nothing, and the screen has to make that obvious.** `BR-0801`
 * and `P-181` fix that access comes from the six roles above; FAST's own roles
 * sit here because an administrator deciding what to grant is better off seeing
 * that the Academy already calls this person a centre coordinator than
 * inferring it from an email address. So the panel is visually separated, is
 * plain text with no control in it, and says outright that it decides nothing.
 *
 * The date is not decoration: the record is read at sign-in (`P-227`), so it is
 * exactly as fresh as this person's last visit and never claims otherwise.
 */
function FastRecord({
  profile,
  copy,
  format,
}: {
  readonly profile: FastProfileDto | undefined;
  readonly copy: AccessContent['users'];
  readonly format: (iso: string) => string;
}) {
  if (!profile) {
    // Absent is a fact worth stating — see `UserAccessDto.fastProfile`.
    return (
      <Typography as="p" variant="text-xs" color="muted">
        {copy.fastNever}
      </Typography>
    );
  }

  const facts: readonly (readonly [string, string])[] = [
    ...(profile.idNumber ? ([[copy.fastIdNumber, profile.idNumber]] as const) : []),
    ...(profile.organization ? ([[copy.fastOrganization, profile.organization]] as const) : []),
    ...(profile.jobTitle ? ([[copy.fastJobTitle, profile.jobTitle]] as const) : []),
  ];

  return (
    <div className={styles.fastPanel}>
      <Typography as="h3" variant="text-sm" weight="bold">
        {copy.fastHeading}
      </Typography>
      <Typography as="p" variant="text-xs" color="muted">
        {copy.fastNote}
      </Typography>

      {facts.length > 0 && (
        <dl className={styles.fastFacts}>
          {facts.map(([label, value]) => (
            <div key={label} className={styles.fastFact}>
              <Typography as="dt" variant="text-xs" color="muted">
                {label}
              </Typography>
              <Typography as="dd" variant="text-sm">
                <bdi>{value}</bdi>
              </Typography>
            </div>
          ))}
        </dl>
      )}

      {profile.isEmployee && (
        <div className={styles.fastTags}>
          <Tag variant="neutral" size="sm">
            {copy.fastEmployee}
          </Tag>
        </div>
      )}

      {profile.fastRoles.length > 0 && (
        <>
          <Typography as="p" variant="text-xs" color="muted">
            {copy.fastRoles}
          </Typography>
          <div className={styles.fastTags}>
            {profile.fastRoles.map((role) => (
              <Tag key={role} variant="neutral" size="sm">
                <bdi>{role}</bdi>
              </Tag>
            ))}
          </div>
        </>
      )}

      {profile.expertPowers.length > 0 && (
        <>
          <Typography as="p" variant="text-xs" color="muted">
            {copy.fastPowers}
          </Typography>
          <div className={styles.fastTags}>
            {profile.expertPowers.map((power) => (
              <Tag key={power} variant="neutral" size="sm">
                {copy.fastPowerNames[power]}
              </Tag>
            ))}
          </div>
        </>
      )}

      <Typography as="p" variant="text-xs" color="muted">
        {copy.fastSynced(format(profile.lastSyncedAt))}
      </Typography>
    </div>
  );
}

interface AssignDraft {
  /** `''` is "nothing chosen yet" — never sent, the button stays disabled. */
  readonly roleCode: RoleCode | '';
  readonly scopeRef: string;
}

const EMPTY_DRAFT: AssignDraft = { roleCode: '', scopeRef: '' };

export default function UserRoleAssignmentPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getAccessContent(locale), [locale]);
  const copy = content.users;
  const service = getAccessService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [users, setUsers] = useState<readonly UserAccessDto[]>([]);
  const [audit, setAudit] = useState<readonly AccessAuditEntryDto[]>([]);
  const [centres, setCentres] = useState<readonly CentreDto[]>([]);
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<Readonly<Record<string, AssignDraft>>>({});
  const [issues, setIssues] = useState<Readonly<Record<string, readonly AccessValidationCode[]>>>(
    {}
  );
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    if (!loadedOnce.current) {
      setPhase('loading');
    }
    void Promise.all([
      service.listUsers(query),
      service.listAuditTrail(),
      service.listCentres(),
    ]).then(([usersResult, auditResult, centresResult]) => {
      if (cancelled) {
        return;
      }
      if (!usersResult.ok) {
        setLoadError(usersResult.error);
        setPhase('error');
        return;
      }
      setUsers(usersResult.value);
      setAudit(auditResult.ok ? auditResult.value : []);
      setCentres(centresResult.ok ? centresResult.value : []);
      setPhase('ready');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, reloadKey]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-access-users-title')?.focus();
    }
  }, [phase]);

  const refreshAudit = () => {
    void service.listAuditTrail().then((result) => {
      if (result.ok) {
        setAudit(result.value);
      }
    });
  };

  const replaceUser = (updated: UserAccessDto) => {
    setUsers((current) => current.map((user) => (user.userId === updated.userId ? updated : user)));
  };

  const draftFor = (userId: string): AssignDraft => drafts[userId] ?? EMPTY_DRAFT;

  const setDraft = (userId: string, next: AssignDraft) => {
    setDrafts((current) => ({ ...current, [userId]: next }));
  };

  const assign = (user: UserAccessDto) => {
    const draft = draftFor(user.userId);
    if (draft.roleCode === '') {
      return;
    }
    // The union is the guard: a coordinator carries a centre, nothing else can.
    const input: AssignRoleInput =
      draft.roleCode === SCOPED_ROLE
        ? { roleCode: 'centre_coordinator', scopeRef: draft.scopeRef }
        : { roleCode: draft.roleCode };

    const found = validateAssignRole(input, user.roles);
    setIssues((current) => ({ ...current, [user.userId]: found }));
    if (found.length > 0) {
      return;
    }

    setFailed(false);
    void service.assignRole(user.userId, input).then((result) => {
      if (!result.ok) {
        setFailed(true);
        return;
      }
      replaceUser(result.value);
      setDraft(user.userId, EMPTY_DRAFT);
      refreshAudit();
    });
  };

  const revoke = (user: UserAccessDto, roleCode: RoleCode) => {
    setFailed(false);
    void service.revokeRole(user.userId, roleCode).then((result) => {
      if (!result.ok) {
        setFailed(true);
        return;
      }
      replaceUser(result.value);
      refreshAudit();
    });
  };

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

  const dates = dateFormatter(locale, {
    dateStyle: 'medium',
  });
  const roleOptions = ROLE_CODES.map((roleCode) => ({
    value: roleCode,
    label: content.roles[roleCode],
  }));
  const centreOptions = centres.map((centre) => ({
    value: centre.centreId,
    label: locale === 'ar' ? centre.nameAr : centre.nameEn,
  }));

  return (
    <WorkspacePage labelledBy="eh-access-users-title">
      <AccessAreaNav content={content} current="users" />
      <PageHead titleId="eh-access-users-title" title={copy.title} lead={copy.intro} />

      {failed && (
        <Alert tone="error" surface="tinted" role="alert">
          {content.errors.actionFailed}
        </Alert>
      )}

      <Panel
        flush={users.length > 0}
        toolbar={
          <div className={styles.userSearch}>
            <TextInput
              label={copy.searchLabel}
              type="search"
              placeholder={copy.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        }
      >
        {users.length === 0 ? (
          <EmptyState
            icon={<Icon name="search-remove" size="featured" tone="neutral" />}
            title={copy.empty}
          />
        ) : (
          <ul className={styles.users}>
            {users.map((user) => {
              const draft = draftFor(user.userId);
              const found = issues[user.userId] ?? [];
              return (
                <li key={user.userId} className={styles.userRow}>
                  {/* The person, not just their name (FADS kit, EH-INT-14).
                      An administrator granting access is looking at a list of
                      people, and a row of bare text reads as a list of records. */}
                  <div className={styles.userIdentity}>
                    <Avatar name={user.displayName} size="md" decorative />
                    <div className={styles.userNames}>
                      <Typography as="h2" variant="text-sm" weight="bold">
                        <bdi>{user.displayName}</bdi>
                      </Typography>
                      <Typography as="p" variant="text-xs" color="muted">
                        <bdi>{user.email}</bdi>
                      </Typography>
                    </div>
                  </div>

                  {user.roles.length === 0 ? (
                    <Typography as="p" variant="text-sm" color="muted">
                      {copy.noRoles}
                    </Typography>
                  ) : (
                    <div className={styles.roleChips}>
                      {user.roles.map((role) => (
                        <span key={role.roleCode} className={styles.roleChip}>
                          <Tag variant="information" size="sm">
                            {content.roles[role.roleCode]}
                            {role.roleCode === 'centre_coordinator' &&
                              ` — ${copy.scopedTo(role.scopeName)}`}
                          </Tag>
                          <Typography as="span" variant="text-xs" color="muted">
                            {copy.assignedBy(
                              role.assignedByName,
                              dates.format(new Date(role.assignedAt))
                            )}
                          </Typography>
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => revoke(user, role.roleCode)}
                          >
                            {copy.revoke(content.roles[role.roleCode])}
                          </Button>
                        </span>
                      ))}
                    </div>
                  )}

                  <FastRecord
                    profile={user.fastProfile}
                    copy={copy}
                    format={(iso) => dates.format(new Date(iso))}
                  />

                  <div className={styles.assignRow}>
                    <Select
                      label={copy.roleLegend}
                      placeholder={copy.assignHeading}
                      value={draft.roleCode}
                      onValueChange={(value) =>
                        setDraft(user.userId, { roleCode: value as RoleCode, scopeRef: '' })
                      }
                      options={roleOptions}
                      errorText={
                        found.includes('already-assigned')
                          ? content.errors.alreadyAssigned
                          : undefined
                      }
                    />
                    {/* §8.8.5 — the coordinator is the only scoped role, so the
                        centre appears with it and disappears with it. */}
                    {draft.roleCode === SCOPED_ROLE && (
                      <Select
                        label={copy.centreLabel}
                        helperText={copy.centreHint}
                        requiredField
                        value={draft.scopeRef}
                        onValueChange={(value) =>
                          setDraft(user.userId, { ...draft, scopeRef: value })
                        }
                        options={centreOptions}
                        errorText={
                          found.includes('scope-required')
                            ? content.errors.scopeRequired
                            : undefined
                        }
                      />
                    )}
                    <Button
                      variant="primary"
                      size="md"
                      disabled={draft.roleCode === ''}
                      onClick={() => assign(user)}
                    >
                      {copy.assign}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* `BR-0806` — assignments and revocations land in the same trail. */}
      <Panel title={content.audit.heading} titleId="eh-access-audit">
        <Typography as="p" variant="text-xs" color="muted">
          {content.audit.immutableNote}
        </Typography>
        {audit.length === 0 ? (
          <Typography as="p" variant="text-sm" color="muted">
            {content.audit.empty}
          </Typography>
        ) : (
          <ul className={styles.trail} aria-labelledby="eh-access-audit">
            {audit.slice(0, 12).map((entry) => (
              <li key={entry.entryId} className={styles.trailRow}>
                <Typography as="span" variant="text-sm">
                  <bdi>{locale === 'ar' ? entry.summaryAr : entry.summaryEn}</bdi>
                </Typography>
                <Typography as="span" variant="text-xs" color="muted">
                  {content.audit.entry(entry.actorName, dates.format(new Date(entry.occurredAt)))}
                </Typography>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </WorkspacePage>
  );
}
