import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import detailFixture from '../../contracts/fixtures/internal.agreement-detail.json';
import documentFixture from '../../contracts/fixtures/internal.agreement-document.json';
import applicantAgreement from '../../contracts/fixtures/me.application-agreement.json';
import {
  clearExpertHubSession,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { fakeApiClient, keyPaths } from '../../contracts/fakeApiClient';
import {
  createHttpApplicationsProvider,
  setApplicationsServiceForTesting,
} from '../applications/applicationsService';
import { createMockApplicationsProvider } from '../applications/mockApplicationsProvider';
import { getApplicationDetailContent } from '../applications/applicationDetail.content';
import { createHttpAgreementProvider, setAgreementServiceForTesting } from './agreementService';
import { createMockAgreementProvider } from './mockAgreementProvider';
import { getAgreementsContent } from './agreements.content';

/**
 * RB-05 / RB-06 **contract** tests — the agreement document. The internal
 * agreement page and the applicant's application detail run on their REAL HTTP
 * providers, fed the responses the backend's own tests recorded
 * (`contracts/fixtures/`). A non-creator signer must read the whole frozen
 * document (legal text, entered terms, merged data) before deciding, and the
 * applicant must read the same before accepting — with an honest statement of
 * how acceptance is recorded. Variants change values only, never the shape.
 */

const content = getAgreementsContent('ar');
const applicantContent = getApplicationDetailContent('ar');
const { document: doc } = detailFixture;

const APPLICATION_ID = detailFixture.applicationId;
const DETAIL = `v1/internal/applications/${APPLICATION_ID}/agreement`;
const APPLICANT_APPLICATION_ID = 'app-011';
const APPLICANT_DETAIL = `v1/me/applications/${APPLICANT_APPLICATION_ID}`;

/** A reviewer who did NOT create the agreement — the case that used to sign blind. */
const nonCreatorDetail = {
  ...detailFixture,
  viewer: { ...detailFixture.viewer, isCreator: false },
};

/** `fieldValues` is a dictionary and the fixture's `templates` is empty — neither has a fixed key set. */
const shapeOf = (value: unknown) =>
  keyPaths(value).filter(
    (path) => !path.startsWith('.fieldValues.') && !path.startsWith('.templates[')
  );

/** The version line starts with this, whatever the formatted date. */
const versionPrefix = (versionNumber: number) => content.document.version(versionNumber, '');

async function renderInternal(detail: unknown) {
  const { client } = fakeApiClient({ [DETAIL]: detail });
  setAgreementServiceForTesting(createHttpAgreementProvider(client));
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalApplicationAgreement(APPLICATION_ID));
  await screen.findByRole('heading', { level: 1 });
  return result;
}

/**
 * The served agreement block inside an application detail. No full-detail
 * fixture exists, so the rest of the detail is the mock's (its shape is guarded
 * by the applications tests); the `agreement` block is the recorded response.
 */
async function renderApplicant(agreement: unknown, overrides: Record<string, unknown>) {
  const mock = await createMockApplicationsProvider({ latencyMs: 0 }).getApplication(
    APPLICANT_APPLICATION_ID
  );
  if (!mock.ok) {
    throw new Error('mock application app-011 missing');
  }
  const { client } = fakeApiClient({
    [APPLICANT_DETAIL]: { ...mock.value, ...overrides, agreement },
  });
  setApplicationsServiceForTesting(createHttpApplicationsProvider(client));
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.applicationDetail(APPLICANT_APPLICATION_ID));
  await screen.findByRole('heading', { level: 1, name: applicantContent.summary.heading });
  return result;
}

describe('RB-05/06 contract — the agreement document against the real API responses', () => {
  beforeEach(() => {
    clearExpertHubSession();
  });

  afterEach(() => {
    setAgreementServiceForTesting(null);
    setApplicationsServiceForTesting(null);
  });

  it('the document endpoint and the detail serve one shape, and the mocks serve exactly the fixtures’ keys', async () => {
    expect(keyPaths(doc)).toEqual(keyPaths(documentFixture));
    expect(keyPaths(applicantAgreement.document)).toEqual(keyPaths(documentFixture));

    const internal = await createMockAgreementProvider({
      latencyMs: 0,
      prepared: true,
      seedSequence: [
        { approverId: 'stf-02', obligation: 'mandatory' },
        { approverId: 'stf-01', obligation: 'mandatory', isSigner: true },
      ],
    }).getAgreementDetail('app-3001');
    expect(internal.ok).toBe(true);
    if (!internal.ok) {
      return;
    }
    expect(shapeOf(internal.value)).toEqual(shapeOf(detailFixture));
    expect(keyPaths(internal.value.document)).toEqual(keyPaths(documentFixture));

    // The applicant's block, once decided — the fixture records a modification request.
    const decided = await createMockApplicationsProvider({ latencyMs: 0 }).decideOnAgreement(
      APPLICANT_APPLICATION_ID,
      { kind: 'request-modification', note: 'تعديل' }
    );
    expect(decided.ok).toBe(true);
    if (!decided.ok) {
      return;
    }
    expect(keyPaths(decided.value.agreement)).toEqual(keyPaths(applicantAgreement));
  });

  it('internal: a NON-creator reviewer reads the whole frozen document before deciding', async () => {
    await renderInternal(nonCreatorDetail);

    const section = screen.getByRole('region', { name: content.document.heading });
    // The fixed legal text.
    expect(within(section).getByText(doc.bodyText)).toBeInTheDocument();
    // A creator-entered term — label and value.
    expect(within(section).getByText('تاريخ بداية الاتفاقية')).toBeInTheDocument();
    expect(within(section).getByText('2026-09-01')).toBeInTheDocument();
    // Merged data — a whole group, heading and entry.
    expect(within(section).getByRole('heading', { name: 'البيانات المصرفية' })).toBeInTheDocument();
    expect(within(section).getByText('SA0380000000608010167519')).toBeInTheDocument();
    // Evidence: the exact version and its content hash.
    expect(
      within(section).getByText((text) => text.startsWith(versionPrefix(doc.versionNumber)))
    ).toBeInTheDocument();
    expect(within(section).getByText(doc.contentHash)).toBeInTheDocument();
    expect(
      within(section).getByText(content.document.signatureMethods['internal-acceptance'])
    ).toBeInTheDocument();

    // The old "storage not resolved" stub is gone, and nothing is editable.
    expect(screen.queryByText(/المعاينة والتنزيل غير متاحين/)).not.toBeInTheDocument();
    expect(screen.queryByText(content.document.notPrepared)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: content.preparation.edit })
    ).not.toBeInTheDocument();
    // …and the decision is still theirs to take.
    expect(screen.getByRole('button', { name: content.decision.approve })).toBeInTheDocument();
  });

  it('internal: a legacy agreement is labelled as a live rendering, never as a frozen version', async () => {
    await renderInternal({
      ...nonCreatorDetail,
      document: {
        ...doc,
        documentVersionId: null,
        versionNumber: 0,
        contentHash: null,
        createdAt: null,
        snapshot: false,
      },
    });

    expect(screen.getByText(content.document.liveTitle)).toBeInTheDocument();
    expect(screen.getByText(doc.bodyText)).toBeInTheDocument();
    expect(screen.queryByText((text) => text.startsWith(versionPrefix(0)))).not.toBeInTheDocument();
    expect(
      screen.queryByText(content.document.hashLabel, { exact: false })
    ).not.toBeInTheDocument();
  });

  it('applicant: the served document renders before the decision, with the internal-acceptance notice', async () => {
    const { user } = await renderApplicant(
      { ...applicantAgreement, decision: null },
      { action: 'decide-agreement', agreementState: 'awaiting-decision' }
    );
    const { document: served } = applicantAgreement;

    expect(screen.getByText(served.bodyText)).toBeInTheDocument();
    expect(screen.getByText('تاريخ بداية الاتفاقية')).toBeInTheDocument();
    expect(screen.getByText('2026-10-01')).toBeInTheDocument();
    expect(screen.getByText('agr-safe-1-applicant@test.fa.gov.sa')).toBeInTheDocument();
    expect(
      screen.getByText((text) => text.startsWith(versionPrefix(served.versionNumber)))
    ).toBeInTheDocument();
    expect(
      screen.getByText(content.document.signatureMethods['internal-acceptance'])
    ).toBeInTheDocument();
    // No PDF exists, so no download link is offered.
    expect(
      screen.queryByRole('link', { name: applicantContent.agreementPreview.download })
    ).not.toBeInTheDocument();

    // Signing is kept, and the dialog says what is actually recorded.
    await user.click(screen.getByRole('button', { name: applicantContent.agreementDecision.sign }));
    expect(
      await screen.findByText(applicantContent.agreementDecision.signDialog.signatureHint)
    ).toBeInTheDocument();
  });

  it('applicant: after a modification request the document stays readable beside the note', async () => {
    await renderApplicant(applicantAgreement, {
      action: 'none',
      agreementState: 'modification-requested',
    });

    expect(screen.getByText(applicantAgreement.document.bodyText)).toBeInTheDocument();
    expect(
      screen.getByText(applicantContent.agreementDecision.modificationNotice)
    ).toBeInTheDocument();
    expect(screen.getByText(applicantAgreement.decision.note)).toBeInTheDocument();
  });
});
