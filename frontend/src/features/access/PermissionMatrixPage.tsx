import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Loading } from '@ds/composite';
import { Checkbox, Select, Tag, TextInput, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { getAccessService } from './accessService';
import { getAccessContent } from './access.content';
import { AccessAreaNav } from './AccessAreaNav';
import {
  DATA_SCOPES,
  grantKey,
  type AccessAuditEntryDto,
  type DataScope,
  type PermissionMatrixDto,
  type RoleCode,
} from './access.types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './AccessPage.module.css';
import { dateFormatter } from '../../shared/formatting';

/**
 * EH-INT-14 — the role × permission matrix (**CAP-08 / `F-0801`**), at
 * `/expert-hub/internal/access/permissions`.
 *
 * `US-0801`: "manage a matrix binding each role to its available permissions, so
 * I control access from one place with one logic."
 *
 * Three things the page states rather than leaves to be inferred:
 *
 * - **The grid is a draft.** `DM-GAP-07` has not arrived, so it starts empty
 *   *deliberately* — filling it with plausible defaults would turn a known gap
 *   into invented policy, and an administrator would have no way to tell.
 * - **There is no per-user override.** `BR-0801` grants exclusively through
 *   roles. Someone looking for a per-user exception is told it is the rule.
 * - **There is no add-role control.** §8.8.5 fixes six.
 *
 * §8.8.3 — "access is governed for functions **and data** together" — is why a
 * granted cell also carries a data scope, and why revoking clears it: an
 * ungranted permission has no scope to hold.
 */

type Phase = 'loading' | 'error' | 'ready';

export default function PermissionMatrixPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getAccessContent(locale), [locale]);
  const copy = content.matrix;
  const service = getAccessService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [matrix, setMatrix] = useState<PermissionMatrixDto | null>(null);
  const [audit, setAudit] = useState<readonly AccessAuditEntryDto[]>([]);
  const [query, setQuery] = useState('');
  const [capability, setCapability] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [failed, setFailed] = useState(false);
  const loadedOnce = useRef(false);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void Promise.all([service.getPermissionMatrix(), service.listAuditTrail()]).then(
      ([matrixResult, auditResult]) => {
        if (cancelled) {
          return;
        }
        if (!matrixResult.ok) {
          setLoadError(matrixResult.error);
          setPhase('error');
          return;
        }
        setMatrix(matrixResult.value);
        setAudit(auditResult.ok ? auditResult.value : []);
        setPhase('ready');
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-permissions-title')?.focus();
    }
  }, [phase]);

  const refreshAudit = () => {
    void service.listAuditTrail().then((result) => {
      if (result.ok) {
        setAudit(result.value);
      }
    });
  };

  const toggle = (roleCode: RoleCode, id: string, granted: boolean) => {
    setFailed(false);
    void service.setGrant(roleCode, id, granted, granted ? 'all' : null).then((result) => {
      if (result.ok) {
        setMatrix(result.value);
        refreshAudit();
      } else {
        setFailed(true);
      }
    });
  };

  const setScope = (roleCode: RoleCode, id: string, scope: DataScope) => {
    setFailed(false);
    void service.setGrant(roleCode, id, true, scope).then((result) => {
      if (result.ok) {
        setMatrix(result.value);
        refreshAudit();
      } else {
        setFailed(true);
      }
    });
  };

  if (phase === 'loading') {
    return (
      <WorkspacePage label={copy.title}>
        <Loading variant="skeleton" lines={6} label={copy.title} />
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

  if (phase === 'error' || matrix == null) {
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

  const term = query.trim().toLowerCase();
  const searching = term !== '';

  /* One capability at a time.
   *
   * §8.8.4 defines a permission as one feature *within a capability*, so a
   * capability is the unit an administrator configures — and 58 × 6 is 348 live
   * controls, which is a lot to put on one screen and a lot to re-render on
   * every keystroke. Searching escapes the grouping and spans everything,
   * because a code like `F-0801` should be findable without first knowing which
   * capability owns it. */
  const capabilities = [...new Set(matrix.permissions.map((p) => p.capabilityCode))];
  const activeCapability = capabilities.includes(capability) ? capability : (capabilities[0] ?? '');
  const visible = searching
    ? matrix.permissions.filter(
        (permission) =>
          permission.nameEn.toLowerCase().includes(term) ||
          permission.nameAr.includes(query.trim()) ||
          // The codes stay searchable — they are how the requirements
          // document refers to a feature — but they are no longer displayed.
          permission.featureCode.toLowerCase().includes(term)
      )
    : matrix.permissions.filter((permission) => permission.capabilityCode === activeCapability);
  const grantMap = new Map(
    matrix.grants
      .filter((grant) => grant.granted)
      .map((grant) => [grantKey(grant.roleCode, grant.permissionId), grant])
  );
  const dates = dateFormatter(locale, {
    dateStyle: 'medium',
  });

  return (
    <WorkspacePage labelledBy="eh-permissions-title">
      <AccessAreaNav content={content} current="permissions" />

      <PageHead
        titleId="eh-permissions-title"
        title={copy.title}
        lead={copy.intro}
        summary={copy.grantedCount(grantMap.size, matrix.permissions.length * matrix.roles.length)}
      />

      {/* `DM-GAP-07` — say it is a draft, at the top, before anything else. */}
      {matrix.modelStatus === 'unapproved' && (
        <Alert tone="warning" surface="tinted" role="note" title={copy.unapprovedTitle}>
          {copy.unapprovedBody}
        </Alert>
      )}
      {failed && (
        <Alert tone="error" surface="tinted" role="alert">
          {content.errors.actionFailed}
        </Alert>
      )}

      <Panel
        flush={visible.length > 0}
        toolbar={
          <>
            {/* `BR-0801` and §8.8.5 — why two controls a reader might look for
                are absent. */}
            <Typography as="p" variant="text-xs" color="muted">
              {copy.noDirectGrantNote}
            </Typography>
            <Typography as="p" variant="text-xs" color="muted">
              {copy.rolesFixedNote}
            </Typography>
            {matrix.unverifiedLabelCount > 0 && (
              <Typography as="p" variant="text-xs" color="muted">
                {copy.labelsNote(matrix.unverifiedLabelCount)}
              </Typography>
            )}
            <div className={styles.matrixControls}>
              <Select
                label={copy.capabilityLabel}
                helperText={searching ? copy.searchScopeNote : copy.capabilityHint}
                value={activeCapability}
                disabled={searching}
                onValueChange={setCapability}
                options={capabilities.map((code) => ({
                  value: code,
                  label: copy.capabilityOption(
                    code,
                    matrix.permissions.filter((p) => p.capabilityCode === code).length
                  ),
                }))}
              />
              <TextInput
                label={copy.searchLabel}
                type="search"
                placeholder={copy.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </>
        }
      >
        {visible.length === 0 ? (
          <Typography as="p" variant="text-sm" color="muted">
            {copy.empty}
          </Typography>
        ) : (
          <div className={styles.matrixFlush}>
            <table className={styles.matrix}>
              <caption className="fads-visually-hidden">{copy.title}</caption>
              <thead>
                <tr>
                  <th scope="col">{copy.featureLabel}</th>
                  {matrix.roles.map((role) => (
                    <th key={role.roleCode} scope="col">
                      {content.roles[role.roleCode]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((permission) => (
                  <tr key={permission.permissionId}>
                    <th scope="row" className={styles.featureCell}>
                      {/* Named by what the feature does. The requirements
                          document's codes identify it there, not here. */}
                      <Typography as="span" variant="text-sm" weight="bold">
                        <bdi>
                          {locale === 'ar' ? permission.nameAr : permission.nameEn}
                          {permission.labelNeedsVerification && ' ⚠️'}
                        </bdi>
                      </Typography>
                      <Tag variant="neutral" size="xs">
                        {copy.capabilityNames[permission.capabilityCode] ??
                          permission.capabilityCode}
                      </Tag>
                    </th>
                    {matrix.roles.map((role) => {
                      const grant = grantMap.get(grantKey(role.roleCode, permission.permissionId));
                      const roleName = content.roles[role.roleCode];
                      return (
                        <td key={role.roleCode} className={styles.grantCell}>
                          <Checkbox
                            // The grid's row and column headers carry the
                            // meaning visually; the label exists for a screen
                            // reader, which needs both names in one string.
                            label={
                              <span className="fads-visually-hidden">
                                {copy.grantedLabel(roleName, permission.featureCode)}
                              </span>
                            }
                            checked={grant != null}
                            onChange={(event) =>
                              toggle(role.roleCode, permission.permissionId, event.target.checked)
                            }
                          />
                          {/* §8.8.3 — functions *and data*: a grant carries a scope. */}
                          {grant != null && (
                            <Select
                              label={
                                <span className="fads-visually-hidden">
                                  {copy.scopeLabel(roleName, permission.featureCode)}
                                </span>
                              }
                              value={grant.dataScope ?? 'all'}
                              onValueChange={(value) =>
                                setScope(role.roleCode, permission.permissionId, value as DataScope)
                              }
                              options={DATA_SCOPES.map((scope) => ({
                                value: scope,
                                label: content.scopes[scope],
                              }))}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* `BR-0806` — every change lands here, and nothing removes it. */}
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
