import { describe, expect, it } from 'vitest';
import { availableServicesFor, deltaAttachmentsFor, deltaFieldsFor } from './addService.types';
import type { ApplicationFieldSchema, ApplicationFormSchemaDto } from './applicationForm.types';
import { APPLICATION_FORM_SCHEMA } from './applicationSchema';

/**
 * J-03/F1 — the two rules that decide what an approved trainer is shown and
 * asked for when widening their scope. They live in `addService.types.ts`
 * rather than inside the page so they can be asserted directly.
 *
 * The supplied `DM-GAP-01` matrix is **uniform** — its `*` legend makes every
 * starred field required for all four services — so against the live schema
 * the honest `BR-0111` delta is *empty*: an approved trainer has already
 * supplied everything the new service needs. The engine's differencing rules
 * are therefore asserted against constructed schema variants, so a future
 * non-uniform map is still served correctly.
 */

function field(overrides: Partial<ApplicationFieldSchema>): ApplicationFieldSchema {
  return {
    id: 'fixture',
    type: 'text',
    sectionId: 'training-content',
    labelAr: 'حقل',
    labelEn: 'Field',
    requiredFor: [],
    ownership: 'expert-hub',
    order: 900,
    ...overrides,
  };
}

/** A variant with a trainer-only REQUIRED field and a trainer-only OPTIONAL one. */
function nonUniformSchema(): ApplicationFormSchemaDto {
  return {
    ...APPLICATION_FORM_SCHEMA,
    fields: [
      ...APPLICATION_FORM_SCHEMA.fields,
      field({ id: 'trainerOnlyRequired', requiredFor: ['trainer'], visibleFor: ['trainer'] }),
      field({ id: 'trainerOnlyOptional', requiredFor: [], visibleFor: ['trainer'], order: 901 }),
      field({
        id: 'sharedWriterField',
        requiredFor: ['content-developer', 'question-writer'],
        order: 902,
      }),
    ],
  };
}

describe('J-03/F1/AC-1 — available services', () => {
  it('excludes every already-approved service', () => {
    const available = availableServicesFor(APPLICATION_FORM_SCHEMA, ['consultant']);
    expect(available).not.toContain('consultant');
    expect(available).toContain('trainer');
  });

  it('returns nothing when the trainer already holds every selectable service', () => {
    const available = availableServicesFor(
      APPLICATION_FORM_SCHEMA,
      APPLICATION_FORM_SCHEMA.selectableServices
    );
    expect(available).toEqual([]);
  });
});

describe('J-03/F1/AC-2 — delta fields', () => {
  it('asks a consultant only the Training-specific questions — nothing already held', () => {
    /*
      Until `dm-gap-01.2026-09-21` this delta was EMPTY: the matrix made every
      starred field required for all four services, so widening the scope asked
      for nothing. The approved per-service split of Section 5 changed the
      fact, not the rule — a consultant adding Training genuinely has not
      answered the Training questions yet, and `BR-0111` still forbids
      re-requesting anything they have already given.
    */
    const ids = deltaFieldsFor(APPLICATION_FORM_SCHEMA, 'trainer', ['consultant']).map(
      (field) => field.id
    );
    expect(ids).toEqual(['hasReadyMaterials', 'preferredDeliveryMode', 'trainingExperienceYears']);
    // Nothing shared with the service they already hold is re-requested.
    expect(ids).not.toContain('firstNameAr');
    expect(ids).not.toContain('consultingExperienceYears');
    // Files are still uniform, so no attachment is re-requested.
    expect(deltaAttachmentsFor(APPLICATION_FORM_SCHEMA, 'trainer', ['consultant'])).toEqual([]);
  });

  it('asks only for the new service’s own fields (no re-entry of held data)', () => {
    const ids = deltaFieldsFor(nonUniformSchema(), 'trainer', ['consultant']).map((f) => f.id);
    expect(ids).toContain('trainerOnlyRequired');
    // Nothing shared with the service they already hold is re-requested.
    expect(ids).not.toContain('firstNameAr');
  });

  it('drops a field the trainer already supplies through a held service', () => {
    // The two writer services share a field; a Content Developer adding
    // Question Writer must not be asked for it again.
    const ids = deltaFieldsFor(nonUniformSchema(), 'question-writer', ['content-developer']).map(
      (f) => f.id
    );
    expect(ids).not.toContain('sharedWriterField');
  });

  it('asks ONLY for mandatory fields — an optional service-specific field is not requested', () => {
    const ids = deltaFieldsFor(nonUniformSchema(), 'trainer', ['consultant']).map((f) => f.id);
    expect(ids).toContain('trainerOnlyRequired');
    expect(ids).not.toContain('trainerOnlyOptional'); // visible, but optional
  });
});

describe('J-03/F1/AC-2 — delta attachments', () => {
  it('asks only for attachments the held services do not already require', () => {
    const forTrainer = deltaAttachmentsFor(APPLICATION_FORM_SCHEMA, 'trainer', []).map((a) => a.id);
    const asDelta = deltaAttachmentsFor(APPLICATION_FORM_SCHEMA, 'trainer', ['consultant']).map(
      (a) => a.id
    );
    // Adding to an existing service asks for no more than a fresh application would.
    expect(asDelta.length).toBeLessThanOrEqual(forTrainer.length);
    for (const id of asDelta) {
      expect(forTrainer).toContain(id);
    }
  });
});
