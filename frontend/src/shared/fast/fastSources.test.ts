import { describe, expect, it } from 'vitest';
import { FAST_COLUMNS, FAST_SCHEMA_SNAPSHOT } from './fastSchema';
import { FAST_SOURCES, PENDING_FAST_SOURCES } from './fastSources';

/**
 * The point of this file: **a FAST field cannot be claimed unless FAST supplied
 * it.**
 *
 * `fastSources.ts` says where each Expert Hub field's value comes from. That is
 * only worth anything if the claims are true, and the two supplied field files
 * are the only thing that can decide. So every claim is checked against the
 * generated snapshot, and a column nobody supplied fails the build — the same
 * discipline the journeys get, applied to the data dictionary.
 */
describe('FAST provenance', () => {
  it('every claimed source column was actually supplied', () => {
    const unknown = FAST_SOURCES.filter((source) => !FAST_COLUMNS.has(source.column));
    // Named individually so a failure says *which* column was invented.
    expect(unknown.map((source) => `${source.field} → ${source.column}`)).toEqual([]);
  });

  it('every claimed table was actually supplied', () => {
    const tables = new Set(Object.keys(FAST_SCHEMA_SNAPSHOT));
    const unknown = FAST_SOURCES.map((source) =>
      source.column.slice(0, source.column.lastIndexOf('.'))
    ).filter((table) => !tables.has(table));
    expect([...new Set(unknown)]).toEqual([]);
  });

  it('no Expert Hub field claims two different FAST columns', () => {
    const byField = new Map<string, string[]>();
    for (const source of FAST_SOURCES) {
      byField.set(source.field, [...(byField.get(source.field) ?? []), source.column]);
    }
    const conflicted = [...byField.entries()].filter(([, columns]) => columns.length > 1);
    expect(conflicted).toEqual([]);
  });

  it('every source names the journey that requires it', () => {
    // A mapping with no journey behind it is a field somebody wanted, not one
    // the product needs — and this is the file where that would hide.
    const orphans = FAST_SOURCES.filter((source) => !/^J-\d\d/.test(source.requiredBy));
    expect(orphans.map((source) => source.field)).toEqual([]);
  });

  /* ── the gaps, asserted as gaps ────────────────────────────────────────── */

  it('`plan.PlanTaker` is still missing — J-21’s enrolment and attendance depend on it', () => {
    const tables = Object.keys(FAST_SCHEMA_SNAPSHOT);
    expect(tables.some((table) => table.endsWith('.PlanTaker'))).toBe(false);
    // …and the code says so rather than pretending otherwise.
    expect(PENDING_FAST_SOURCES.some((pending) => pending.needs.includes('PlanTaker'))).toBe(true);
  });

  it('no lookup table was supplied, so no value list may be treated as confirmed', () => {
    const lookups = Object.keys(FAST_SCHEMA_SNAPSHOT).filter((table) => table.includes('lookup.'));
    expect(lookups).toEqual([]);
    // The four load-bearing ones are each named in the pending list.
    const needs = PENDING_FAST_SOURCES.map((pending) => pending.needs).join(' ');
    for (const lookup of ['TrainingMaterialStatus', 'TrainingType', 'PlanLocation']) {
      expect(needs).toContain(lookup);
    }
  });

  it('every pending source names the question that would settle it', () => {
    const unnumbered = PENDING_FAST_SOURCES.filter((pending) => !/Q\d\d/.test(pending.question));
    expect(unnumbered.map((pending) => pending.field)).toEqual([]);
  });

  /* ── the snapshot itself ───────────────────────────────────────────────── */

  it('the snapshot holds what the two files supplied', () => {
    expect(Object.keys(FAST_SCHEMA_SNAPSHOT)).toHaveLength(15);
    expect(FAST_COLUMNS.size).toBe(406);
    // Spot-check one column per journey that depends on this data.
    for (const column of [
      'ImsTraining.plan.PlanTrainer.TrainerId', // J-18/F4
      'ImsTraining.plan.PlanScheduleDay.EndDate', // J-21/F5
      'ImsTraining.plan.Plan.TrainingMaterialStatusId', // J-20/F5
      'ImsTraining.plan.Plan.PlanCancelReasonId', // J-22/F3
      'ImsTraining.plan.Plan.TeamsUrl', // J-21/F2
      'profile.UserProfile.BankIBAN', // J-09/F6
    ]) {
      expect(FAST_COLUMNS.has(column)).toBe(true);
    }
  });
});
