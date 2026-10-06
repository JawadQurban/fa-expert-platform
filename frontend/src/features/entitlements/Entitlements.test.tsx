import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { setEntitlementServiceForTesting } from './entitlementService';
import { createMockEntitlementProvider } from './mockEntitlementProvider';
import type { MockEntitlementProviderOptions } from './mockEntitlementProvider';
import { getEntitlementsContent } from './entitlements.content';
import {
  DEFAULT_ENTITLEMENT_QUERY,
  hasActiveEntitlementQuery,
  isVisibleToTrainer,
  LINKAGE_STEPS,
} from './entitlement.types';

const content = getEntitlementsContent('ar');

function injectProvider(options: MockEntitlementProviderOptions = {}) {
  setEntitlementServiceForTesting(createMockEntitlementProvider({ latencyMs: 0, ...options }));
}

async function renderMine() {
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.entitlements);
  await screen.findByRole('heading', { level: 1, name: content.mine.title });
  return result;
}

async function renderInternal() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalEntitlements);
  await screen.findByRole('heading', { level: 1, name: content.internal.title });
  return result;
}

describe('CAP-06 / J-28 — Financial entitlements', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setEntitlementServiceForTesting(null);
  });

  /* ── BR-0601 — consumed from ERP, never authored here ──────────────────── */

  it('BR-0601: the contract has no write operation at all', () => {
    const service = createMockEntitlementProvider({ latencyMs: 0 });
    // "Never entered or edited by hand, under any circumstance" — encoded as
    // the absence of any door, rather than a guard on one.
    expect(Object.keys(service)).toEqual(['listMyEntitlements', 'listEntitlements']);
    for (const forbidden of ['create', 'update', 'recordPayment', 'dispute', 'correct']) {
      expect(Object.keys(service)).not.toContain(forbidden);
    }
  });

  it('BR-0601: the trainer is told the numbers are ERP’s, not the platform’s', async () => {
    await renderMine();
    expect(screen.getByText(content.mine.sourceNote)).toBeInTheDocument();
  });

  /* ── BR-0605 — no dispute path in this release ─────────────────────────── */

  it('BR-0605: there is no dispute action, and the page says where an enquiry goes', async () => {
    await renderMine();
    expect(screen.getByText(content.mine.noDisputeNote)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /اعتراض/ })).not.toBeInTheDocument();
  });

  /* ── BR-0603 — an incompletely-linked record is hidden from the trainer ── */

  it('BR-0603: the trainer only receives fully-linked records', async () => {
    const service = createMockEntitlementProvider({ latencyMs: 0 });
    const mine = await service.listMyEntitlements();
    const all = await service.listEntitlements(DEFAULT_ENTITLEMENT_QUERY);
    expect(mine.ok && all.ok).toBe(true);
    if (!mine.ok || !all.ok) {
      return;
    }
    // The seed deliberately contains an incomplete record for this trainer…
    const hiddenFromMe = all.value.filter(
      (row) => row.trainerId === 'trn-101' && !isVisibleToTrainer(row)
    );
    expect(hiddenFromMe.length).toBeGreaterThan(0);
    // …and it does not reach the trainer.
    const visibleIds = mine.value.map((row) => row.entitlementId);
    for (const hidden of hiddenFromMe) {
      expect(visibleIds).not.toContain(hidden.entitlementId);
    }
  });

  it('BR-0603: every record the trainer receives carries the whole chain', async () => {
    const service = createMockEntitlementProvider({ latencyMs: 0 });
    const mine = await service.listMyEntitlements();
    expect(mine.ok).toBe(true);
    if (!mine.ok) {
      return;
    }
    expect(mine.value.length).toBeGreaterThan(0);
    for (const row of mine.value) {
      // PO → agreement → programme, all present. The type has no null to check;
      // this asserts the data honours what the type promises.
      expect(row.purchaseOrderNumber).not.toBe('');
      expect(row.agreementReference).not.toBe('');
      expect(row.programName.ar).not.toBe('');
    }
  });

  it('BR-0603: the hidden record is not rendered anywhere in the trainer’s portal', async () => {
    const { container } = await renderMine();
    // `ent-003` is the seeded incomplete record; its PO must appear nowhere.
    expect(container.textContent).not.toContain('PO-2026-005130');
  });

  /* ── F-0602 — the staff view, and the support call it answers ──────────── */

  it('F-0602: staff see the hidden record, and are told why it is hidden', async () => {
    await renderInternal();
    expect(await screen.findByText(content.internal.hiddenTitle)).toBeInTheDocument();
    expect(screen.getByText(content.internal.hiddenBody)).toBeInTheDocument();
  });

  it('BR-0602: an incomplete record names which hop of the chain is missing', async () => {
    const service = createMockEntitlementProvider({ latencyMs: 0 });
    const all = await service.listEntitlements(DEFAULT_ENTITLEMENT_QUERY);
    expect(all.ok).toBe(true);
    if (!all.ok) {
      return;
    }
    for (const row of all.value) {
      if (isVisibleToTrainer(row)) {
        continue;
      }
      expect(row.missingLinks.length).toBeGreaterThan(0);
      for (const step of row.missingLinks) {
        expect(LINKAGE_STEPS).toContain(step);
      }
    }
  });

  it('F-0602: staff can isolate the records their trainers cannot see', async () => {
    const service = createMockEntitlementProvider({ latencyMs: 0 });
    const incomplete = await service.listEntitlements({
      ...DEFAULT_ENTITLEMENT_QUERY,
      onlyIncomplete: true,
    });
    expect(incomplete.ok).toBe(true);
    if (!incomplete.ok) {
      return;
    }
    expect(incomplete.value.length).toBeGreaterThan(0);
    expect(incomplete.value.every((row) => !isVisibleToTrainer(row))).toBe(true);
  });

  it('F-0602: staff can look a trainer up by name — the call this screen answers', async () => {
    const { user } = await renderInternal();
    await screen.findByText(content.internal.resultsCount(5));
    await user.type(screen.getByLabelText(content.internal.searchLabel), 'ريم');
    expect(await screen.findByText(content.internal.resultsCount(1))).toBeInTheDocument();
  });

  it('the query helper reports when a filter is active', () => {
    expect(hasActiveEntitlementQuery(DEFAULT_ENTITLEMENT_QUERY)).toBe(false);
    expect(hasActiveEntitlementQuery({ trainer: 'ريم', onlyIncomplete: false })).toBe(true);
    expect(hasActiveEntitlementQuery({ trainer: '  ', onlyIncomplete: true })).toBe(true);
    expect(hasActiveEntitlementQuery({ trainer: '  ', onlyIncomplete: false })).toBe(false);
  });

  /* ── Q27 — the ERP status list is not ours to enumerate ────────────────── */

  it('Q27: a disbursement status is rendered as ERP sent it, not mapped to a known set', async () => {
    await renderMine();
    // The platform enumerates none of these; the label comes down with the code.
    expect(await screen.findByText('مصروف')).toBeInTheDocument();
    expect(screen.getByText('قيد الصرف')).toBeInTheDocument();
  });

  it('a pending entitlement shows no invented disbursement date', async () => {
    await renderMine();
    expect(screen.getByText(content.noDate)).toBeInTheDocument();
  });

  /* ── §8.6 — the capability calculates nothing ──────────────────────────── */

  it('no total is displayed — this capability calculates no amount', async () => {
    const { container } = await renderMine();
    // 9000 + 7500 = 16500. A platform-computed sum could disagree with ERP,
    // which §8.6 makes the system of record (P-125).
    expect(container.textContent).not.toContain('16500');
    expect(container.textContent).not.toContain('16,500');
  });

  /* ── accessibility ─────────────────────────────────────────────────────── */

  it('renders RTL and has no automatically-detectable a11y violations', async () => {
    const { container } = await renderMine();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    await expectNoA11yViolations(container);
  });

  it('the staff register has no automatically-detectable a11y violations', async () => {
    const { container } = await renderInternal();
    await screen.findByText(content.internal.resultsCount(5));
    await expectNoA11yViolations(container);
  });
});
