# Expert Hub — Business Review Remediation, 2026-10-01

Source: «ملاحظات منصة الخبراء.xlsx» (30 items: G-01, G-02, UI-01 … UI-28).

> ⚠️ **The workbook and its screenshots are not in the repository.** This
> remediation was carried out against the items as transcribed into the request.
> Where the transcribed target text conflicts with what the code actually does,
> the conflict is recorded below rather than resolved silently.

**Status counts** — IMPLEMENTED 14 · ALREADY_CORRECT 6 · BUSINESS_DECISION_REQUIRED 8 ·
PARTIALLY_IMPLEMENTED 2.

**Classification key** — A COPY_ONLY · B PRESENTATION_FORMAT · C EXISTING_DATA_BINDING ·
D BEHAVIOR_CHANGE · E BUSINESS_RULE_REQUIRED.

---

## G-01 — Arabic tanween fath on the alif

| | |
|---|---|
| **Comment** | Tanween fath must sit before the alif (`حالياً` → `حاليًا`), reviewed linguistically, never by blind regex. Application-owned UI strings only. |
| **Pages** | Landing page, application detail |
| **Class** | **A COPY_ONLY** |
| **Status** | **IMPLEMENTED** |

127 tanween-bearing words were extracted and read individually. **118 were already
correct**; 9 distinct words (10 occurrences) carried the mark after the alif:

| Word | Corrected | Occurrences |
|---|---|---|
| جزءاً | جزءًا | 2 |
| معاً | معًا | 1 |
| برنامجاً | برنامجًا | 1 |
| تدريبياً | تدريبيًا | 1 |
| إقليمياً | إقليميًا | 1 |
| وعالمياً | وعالميًا | 1 |
| فرقاً | فرقًا | 1 |
| حقيقياً | حقيقيًا | 1 |
| معتمداً | معتمدًا | 1 |

Files: `features/landing/landing.content.ts` (9), `features/applications/applicationDetail.content.ts` (1).

**Verification.** Every change was confirmed at codepoint level to be exactly
`U+0627 U+064B` → `U+064B U+0627` and nothing else. Zero `alif + tanween`
sequences remain anywhere under `src`. No stored user-entered
content was touched.

---

## G-02 — Latin digits for all application-generated numbers

| | |
|---|---|
| **Comment** | Application-generated numbers must use 0–9, not ٠–٩. Centralize formatting instead of per-page fixes; add regression tests. |
| **Pages** | Every page |
| **Class** | **B PRESENTATION_FORMAT** |
| **Status** | **IMPLEMENTED** |

### The cause

**147 `Intl` formatters across 91 files**, each constructed locally. 94 of them
named the `'ar-SA'` locale, which resolves to the `arab` numbering system:

```
ar-SA            1234567 → ١٬٢٣٤٬٥٦٧   medium → ٣٠‏/٠٩‏/٢٠٢٦   long → ٣٠ سبتمبر ٢٠٢٦
ar-SA-u-nu-latn  1234567 → 1,234,567   medium → 30‏/09‏/2026   long → 30 سبتمبر 2026
```

### The fix

New `src/shared/formatting.ts` — the one place Expert Hub turns a
number or a date into text. **All 147 call sites across 90 files now route
through it.** `localeTag('ar')` returns `ar-SA-u-nu-latn`; `-u-nu-latn` changes
*only* the numbering system, so Arabic month names, field order, separators and
the Gregorian calendar are byte-identical to before.

It is deliberately separate from the shared `@utils/format`, which the Hackathon
also consumes and which is governed by that product's own open numeral decision
(Q32). **No Hackathon file was modified.**

32 Arabic-Indic digit literals in application-owned strings were also converted
(`من ٥` → `من 5`, `من ١٠٠` → `من 100`, file-size and headcount limits, `٢٤ ساعة`,
mock fixture years). Each was reviewed individually; comments that discuss
Arabic-Indic digits were left alone.

### Correction to the audit

An intermediate audit reported that `ar-SA` renders **Hijri (Umm al-Qura)** dates.
**That is wrong.** Measured in both Node and Chrome, `ar-SA` resolves to
`calendar: gregory`. Dates were already Gregorian; only the digits were affected.
No calendar override was needed or added.

### Regression tests — `shared/formatting.test.ts`

Behaviour, plus three guards that fail the build on a relapse:
- no `new Intl.NumberFormat`/`DateTimeFormat` anywhere under `apps/expert-hub` except the module itself;
- no `'ar-SA'` locale tag in any production source;
- no Arabic-Indic digit in any string literal (comments excluded).

---

## UI-01 — Trainer dashboard

| | |
|---|---|
| **Pages** | `features/home/PortalHomePage.tsx` |
| **Status** | **ALREADY_CORRECT** (greeting, role badge) · see below for one gap |

Greeting «مرحبًا، {name}», eyebrow «مساحتي» and the role badge
(`classification`, falling back to «مستخدم مسجل») are all bound to real data
from `GET v1/me/home`. Nothing to change.

**Gap found, not fixed — `requiresAction` is computed and never shown.** The
backend returns it (`HomeEndpoints.cs`, `Draft + AgreementPending`) and the DTO
declares it, but the Portal Home metric list omits it — while *My Applications*
renders the same figure as a card. Class **C EXISTING_DATA_BINDING**.
**BUSINESS_DECISION_REQUIRED**: no review comment asked for a fifth dashboard
card, so it was not added.

Also noted: `home.content.ts` `subtitle` and `summaryLine` are populated in both
locales and rendered nowhere (dead copy).

---

## UI-02 — My Applications description

**A COPY_ONLY · IMPLEMENTED.** `وحالتها الحية` → `وحالاتها`; English
"their live status" → "their statuses".

---

## UI-03 — "Start a new application" CTA

**A COPY_ONLY · PARTIALLY_IMPLEMENTED.**

- ✅ `myApplications.actions.newApplication`: «طلب جديد» → «تقديم طلب جديد».
- ✅ `home.shortcuts` and the Portal Home empty state already read «تقديم طلب جديد».
- ⚠️ **`myApplications.actions.applyNow` was changed and then reverted.** Both
  controls render on the same page and point at the same route, so one shared
  label produced **two links with the same accessible name** — caught by
  `MyApplicationsPage.test.tsx` ("Found multiple elements with the role link and
  name تقديم طلب جديد"). That is a WCAG 2.4.4 regression, so the empty-state CTA
  keeps «قدّم طلب الانضمام».
  **BUSINESS_DECISION_REQUIRED**: do you want one label and only one visible
  control, or two distinct labels? Hiding the action-bar button in the empty
  state is a behaviour change nobody asked for, so it was not made.
- ⚠️ **Not changed, deliberately:** the public header `applyLabel`
  («قدّم طلب الانضمام») and the four landing-page CTAs («انضم الآن»). These face
  an anonymous visitor who has no applications, so «جديد» would be wrong.
  **BUSINESS_DECISION_REQUIRED.**

---

## UI-04 — Application statistic cards

**A COPY_ONLY · IMPLEMENTED.**

| Card | Was | Now |
|---|---|---|
| in-progress | قيد المعالجة | الطلبات قيد المعالجة |
| approved | معتمدة | الطلبات المعتمدة |
| requires-action | تتطلب إجراءً | الطلبات التي تتطلب إجراءً |

A "requires action" card already existed — nothing was invented. The separate
application **status** vocabulary (`statuses.approved`) is untouched and pinned
by a test, because that is the wire vocabulary, not a card label.

⚠️ **Consistency note.** Portal Home shows the same two counts under the shorter
«قيد المعالجة» / «معتمدة» from a different content file. UI-01 did not ask for
them to change, so they were left. **BUSINESS_DECISION_REQUIRED**: align them or
accept the difference.

---

## UI-05 — Agreement sent date

**A COPY_ONLY · IMPLEMENTED.** «وصلتك الاتفاقية بتاريخ {date}» →
«تم إرسال الاتفاقية إليك بتاريخ {date}».

The date itself is `SentToApplicantAt ?? ApplicantDecidedAt ?? CreatedAt`,
rendered Gregorian with Latin digits after G-02.

---

## UI-06 — Service-name localization

**C EXISTING_DATA_BINDING · IMPLEMENTED.**

The agreement document's «الخدمات المشمولة» group printed the **raw service
code**, so a trainer read `trainer` on their own agreement
(`AgreementEndpoints.cs`, confirmed in all three contract fixtures).

An approved Arabic service map already existed server-side — "the BRD §6
vocabulary" — but was private to `ServiceRequestEndpoints`. It was moved to
`ApplicationServices.NameAr(code)` in `ExpertHub.Core` so the notification
templates and the agreement document share one source, and the agreement group
now emits the Arabic name. Nothing was invented.

**Historical agreements are unaffected**: `MergedData` is serialized onto each
frozen version and read back from storage, so only newly frozen versions are
built from this code path.

Also noted, not changed: `assignments.content.ts` carries a second, 4-entry
service map (no `speaker`). Values match the canonical map today, so there is no
visible defect — but it can drift. Class **C**.

---

## UI-07 — Internal placeholders on the trainer-facing agreement

| | |
|---|---|
| **Class** | **E BUSINESS_RULE_REQUIRED** (+ **D** for the version/hash question) |
| **Status** | **BUSINESS_DECISION_REQUIRED** — not implemented |

The applicant sees, on their own agreement:

- `القالب: الاتفاقية الموحدة — الإصدار mock-dm-gap-16-draft.1`
- `⚠️ نص تجريبي — بانتظار النص القانوني المعتمد (DM-GAP-16). …`
- the 64-character SHA-256 `contentHash`

All three come from `AgreementSeedData.cs` — placeholders standing in for the
Academy's approved legal text. **DM-GAP-16 is an open gap; the real wording
cannot be inferred, so nothing was substituted.**

Two separable decisions:
1. **Supply the approved template name, version and body text.** Business input required.
2. **Should `templateVersion` and `contentHash` be shown to the applicant at all?**
   `AgreementDocumentView` is shared by the applicant and internal staff, so
   suppressing them for the applicant means splitting that block or passing an
   audience flag — a **D BEHAVIOR_CHANGE**.

**Per instruction, no versioning, hash or audit data was removed from
persistence.** This is purely a question of what is presented.

---

## UI-08 — Banking section wording

**A COPY_ONLY · IMPLEMENTED.** «البيانات البنكية» → «البيانات المصرفية».

Applied consistently to **all 26 occurrences of the adjective across 11 files** —
profile, agreement preparation, committee, the three contract fixtures and the
backend merged-data group title — because changing only the profile heading would
have left the applicant's own agreement saying «بنكية» on the next screen.

The **noun** «البنك» is untouched: «اسم البنك» is correct and is pinned by a test.
English "Bank data" is unchanged; the review was of the Arabic.

Historical agreements keep their stored wording, as in UI-06.

---

## UI-09 — Bank name storage

| | |
|---|---|
| **Class** | **E BUSINESS_RULE_REQUIRED** + **D BEHAVIOR_CHANGE** |
| **Status** | **BUSINESS_DECISION_REQUIRED** — not implemented |

`bankName` is **free text** inside a JSON blob (`BankDataRecord.Fields`), with no
format rule and no allowed-value check. There is **no bank reference table
anywhere in the repository** — no entity, no `DbSet`, no seed, no option list.
The only Arabic bank names present are mock fixtures.

Turning it into a picked value needs the Academy's approved bank list, a
reference table, an endpoint, a `TextInput` → `Select` change and a migration
plan for existing free-text values. **No field was invented.**

---

## UI-10 — IBAN and account number

**ALREADY_CORRECT.**

No locale number formatting is applied to `iban`, `accountNumber` or `swiftCode`
anywhere — verified against all 147 `Intl` call sites, none of which touches a
bank field. Both values are stored as typed, validated by pattern only
(`^SA[0-9]{22}$`, `^[0-9]+$`), and rendered verbatim inside `<bdi>` at every
read-only site, which is correct for RTL. **The exact value is preserved.**

Minor, not changed: the editing `TextInput` has no `dir`/`<bdi>` treatment, so a
part-typed IBAN is subject to the surrounding RTL context while being typed.
Class **B**; no corruption.

---

## UI-11 — Directory naming

**A COPY_ONLY · IMPLEMENTED.** The full name appeared **nowhere**, and four
different variants were live.

| Surface | Now |
|---|---|
| Directory H1 | **دليل الخبراء والمدربين المعتمدين** (full) |
| Document title, breadcrumb, header nav, footer | دليل الخبراء والمدربين (short) |
| Portal-home + internal shortcut cards (`دليل الخبراء`) | دليل الخبراء والمدربين |
| Landing final CTA (`تصفّح دليل المدربين`) | تصفّح دليل الخبراء والمدربين |

English standardized to **Expert & Trainer Directory** (was: *Expert directory* /
*Expert & trainer directory* / *Browse the directory*).

Not changed: the header's `البحث` search action (a search entry point, not a name)
and the CAP-10 permission label `دليل المدربين العام`, which is already flagged
`labelNeedsVerification`.

---

## UI-12 — Directory description

**ALREADY_CORRECT.** The current string is byte-identical to the target. Pinned by a test.

---

## UI-13 — Expert / trainer badge

| | |
|---|---|
| **Class** | **E BUSINESS_RULE_REQUIRED** + **D BEHAVIOR_CHANGE** |
| **Status** | **BUSINESS_DECISION_REQUIRED** — not implemented |

Two blocking facts:

1. **The public payload does not carry the person's accredited services at all.**
   `PublicTrainerSummaryWire` and `PublicTrainerProfileWire` have no `Services`
   property. Service codes are loaded server-side only to compute a tier string,
   then discarded. The target badge («مدرب معتمد» / «مستشار معتمد» /
   «خبير ومدرب معتمد») **cannot be derived from the public wire as it stands.**
2. **The existing badge is not really derived.** `Classification()` reads
   `TRAINER_SERVICE.classification`, a *tier* column that **nothing in
   production ever writes**, so every real trainer resolves to `certified` →
   «مدرب معتمد».

A further inconsistency, left as-is: the directory **card** shows a
classification tag, the public **profile** does not, and a test actively asserts
its absence there.

Implementing this needs a ruling on what "معتمد" means per service **and** on
whether publishing the service list is a permitted widening of public disclosure
(the last such widening was an explicit owner ruling).

---

## UI-14 — Directory numbers

**B PRESENTATION_FORMAT · IMPLEMENTED** (via G-02), with two carve-outs.

All directory figures now render Latin digits through the central formatter. The
per-card "programmes delivered" value was a **raw number with no formatting at
all** and now goes through `formatNumber`, so it groups like every other figure.

- ⚠️ **Not fixed — pagination page numbers.** `Pagination` prints the raw integer,
  and it is a **shared Design System component**. The Design System is read-only
  for this task. Class **B**; **EXTERNAL_DEPENDENCY** on the DS owner.
- ⚠️ **`specialtiesRepresented` is always `0`** against the real API, because
  `TrainerProfileService.Specialties()` returns `[]` unconditionally. The
  formatting is correct; the value is not. See UI-16 — same shape of problem.
  **BUSINESS_DECISION_REQUIRED** (the specialization taxonomy is an open item).

---

## UI-15 — Trainer short description

| | |
|---|---|
| **Class** | **E BUSINESS_RULE_REQUIRED** |
| **Status** | **BUSINESS_DECISION_REQUIRED** — reported, nothing added |

**No approved short-bio field exists**, and its absence is a recorded ruling, not
an oversight. `TRAINER_PROFILE` has no text column; neither public wire has any
free-text field beyond `Name`; and `DECISIONS.md` P-55 records that *"the invented
`bio` field was deleted from the application schema"* because `BR-1004` is
explicit that no free-text bio exists.

The one free-text field in the schema is `responsibilities` ("المسؤوليات"), which
has no approval or moderation state and is consumed only by the **internal**
identity card.

**As instructed, no database field was introduced.** Publishing a short bio needs
a business decision on the field, who approves it, and whether it may be public.

---

## UI-16 — Programmes delivered with the Academy

| | |
|---|---|
| **Class** | **C EXISTING_DATA_BINDING** (wire) + **E BUSINESS_RULE_REQUIRED** (source) |
| **Status** | **BUSINESS_DECISION_REQUIRED** |

The metric exists on both public payloads and is correctly bound, counted from
`TRAINER_RECORD`. **But nothing in production ever writes that table** — an
exhaustive scan of `backend/src` finds only reads; the single writer
in the repository is a test helper. It is not derived from `ENGAGEMENT` and not
fed by FAST.

**The value is real in shape and `0` in practice** for every trainer in any
environment that has not been hand-seeded. Who populates `TRAINER_RECORD`, and
from where, is an open business/integration question.

---

## UI-17 — View profile action

**A COPY_ONLY + D BEHAVIOR_CHANGE (accessibility) · IMPLEMENTED.**

- «عرض الملف» → «عرض الملف التعريفي».
- **Accessibility fix.** The visible label repeats identically on every card,
  giving a screen-reader user a list of indistinguishable links (WCAG 2.4.4 /
  2.4.9). A per-trainer accessible name was already written in both locales and
  **referenced nowhere** — it is now the link's `aria-label`.

The control was already a real design-system `Link` rendering a native `<a href>`,
so keyboard access was correct. Noted, not changed: it is a plain `<a>`, so it
triggers a full page load rather than SPA navigation — pre-existing and out of
scope.

---

## UI-18 — My Engagements description

**A COPY_ONLY · IMPLEMENTED.** Now «استعرض عروض الإسناد الواردة إليك وارتباطاتك المؤكَّدة.»

⚠️ The target text dropped the shadda from «المؤكَّدة». The file uses the shadda
consistently in four other places, so it was **kept**. Flag if the business wants
diacritics removed — that is a file-wide change.

---

## UI-19 — Offer response window (verified against the backend)

**ALREADY_CORRECT** as a statement of fact; **BUSINESS_DECISION_REQUIRED** on drift.

Verified in `OfferService.ResponseDueAsync` and the `SLA-0501` seed row:

| | |
|---|---|
| Duration | **3** |
| Unit | **`days` — calendar days, NOT business days** |
| Status | `fixed` |
| On breach | the offer expires and moves to the next-ranked candidate |

The sibling SLA immediately above it *does* use `business-days`, so the
distinction is deliberate. **The UI's "three days" is accurate.**

⚠️ **But it is hardcoded in four strings, and the value is runtime-configurable**
through `POST v1/internal/sla/{slaId}` (the one write path for every deadline in
the product). An operator changing SLA-0501 would leave the copy silently stale;
setting it to `reminders-only` removes the deadline entirely and no SLA badge
renders. **The business rule was not changed.** Binding the sentence to the
server's `responseSla` is available (the data is already per-offer on the wire)
but is a behaviour change nobody asked for.

---

## UI-20 — Offer empty state

**A COPY_ONLY · IMPLEMENTED.** Now «سيصلك عرض إسناد عند اعتماد ترشيحك لأحد الطلبات.»

On the bullets question: `EmptyState` renders `description` as a **single `<p>`**
with no list and no line splitting, and the section already has its own paragraph
above it. A leading hyphen would render literally. No bullets were added.

---

## UI-21 — Confirmed engagements terminology

**ALREADY_CORRECT — and the proposed change would be a regression.**

Renaming the section to «عروض الإسناد التي قبلتها» (*accepted offers*) would be
wrong on three counts, each visible in the code:

1. The section renders `Engagement` rows, not offers. The offer is **consumed**
   at acceptance (`status = accepted`) and a distinct `Engagement` is created.
2. An accepted offer whose engagement was later **withdrawn or cancelled** is
   still an accepted offer but does **not** appear here.
3. An accepted offer whose engagement **completed** also leaves this section.

Offer-based wording would promise rows that are not there. The heading was kept.

---

## UI-22 — Confirmed engagements empty state

**A COPY_ONLY · IMPLEMENTED**, with one deliberate deviation.

«لا توجد ارتباطات مؤكَّدة» → «لا توجد ارتباطات مؤكَّدة حاليًا»;
«يظهر الارتباط…» → «سيظهر الارتباط…».

⚠️ **The target text replaced «الارتباط» with «الإسناد». That was not applied.**
The page's vocabulary is «إسناد» = the *offer*, «ارتباط» = the *engagement*.
Making this one string say «الإسناد» would put two nouns for the same object in
adjacent paragraphs and contradict UI-24, which keeps «الارتباطات السابقة».
**BUSINESS_DECISION_REQUIRED**: confirm the noun, and if «إسناد» is wanted for
the engagement, it is a whole-page vocabulary migration. A test pins the current
single-noun rule.

---

## UI-23 — Previous engagements explanation (verified against the backend)

**A COPY_ONLY · IMPLEMENTED, and made more accurate than the proposed text.**

Verified in `OfferService.Lifecycle`:

- The **end date** decides it, not the start date.
- **The last day still counts as in progress** — a midnight-valued end date is
  explicitly bumped a full day, with a code comment recording the bug this fixed.
- `completed` is **derived on every read**, never stored and never an action.
  Nothing happens server-side; the row is never updated.

⚠️ **The proposed sentence was incomplete.** It names only the end-date path,
but `withdrawn` and `cancelled` are returned **before the dates are examined**,
so a terminated or cancelled engagement lands in "previous" immediately — while
its own status tag says so, contradicting the sentence. The copy now names all
three paths.

Still unstated (narrow edge case, flagged not fixed): an engagement whose request
form carries no dates stays `upcoming` **forever** and never moves here.

---

## UI-24 — Previous engagements empty state

**ALREADY_CORRECT.** «لا توجد ارتباطات سابقة» is consistent with every other
section heading. Both engagement empty states are gated on a `ready` phase, so
neither can flash during loading or after a failure. See the UI-22 warning.

---

## UI-25 — Profile page introduction

**A COPY_ONLY · IMPLEMENTED.** Now
«اطّلع على بياناتك المعتمدة، وحدّث الحقول التي يُسمح لك بتعديلها.»

---

## UI-26 — Overview section permissions

**Report only — no change made.** The permission model is internally consistent
and enforced on both sides of the wire.

| Group | Fields | Permission |
|---|---|---|
| Identity (FAST-owned) | the 12 `ownership: sso-profile` fields | **Change-request only** — queued to FAST, displayed value does not move |
| Expert-Hub-owned form fields | 43 fields | **Directly editable** |
| Classification | 1 | Read-only — set at accreditation |
| Evaluation | 1 | Read-only — calculated |
| Agreement status | 1 | Read-only — owned by the agreement lifecycle |
| Academy contracts | — | Read-only — no approve/refuse/download |
| Banking | the 8 bank fields | **Write-once** while requested, then frozen |
| Certificates | uploads | Trainer-writable |
| File status | — | **Absent from the surface entirely**, by rule |

The server **re-checks** editability on save and returns `403` for a
non-editable field, with an explicit comment that a client skipping the UI must
still be refused. A trainer with no Expert Hub file gets every field `locked`.

**Per instruction, no approved/read-only identity, evaluation, agreement,
banking or governance field was made editable.**

---

## UI-27 — Public visibility privacy (tested, not assumed)

**ALREADY_CORRECT** on every named item.

Both anonymous endpoints were read field by field against their wire records:

| Item | Reaches an anonymous caller? |
|---|---|
| email | **NO** — internal-only wire, behind the internal policy + feature check |
| mobile / phone | **NO** — not on any public record |
| bank data / IBAN | **NO** — ownership-scoped endpoint only |
| internal notes | **NO** — no free-text property exists on either public record |
| screening data | **NO** |
| interview data | **NO** |
| agreement internals | **NO** |
| private document ids | **NO** — no photo or attachment property on the public profile |

The consent gate filters `VisibilityConsent` **in SQL**, and the by-id handler
returns an **identical `404`** for a malformed id, an unknown id, a non-consenting
trainer and a non-listable one — unknown and withheld are indistinguishable.

**Two genuine exposures, both reported rather than changed:**

1. **`deliveredPrograms[].id` is the raw `TRAINER_RECORD` primary key.** The
   public page never links or acts on it — it is only a React `key`. Gratuitous
   internal-identifier exposure. Class **D**; **BUSINESS_DECISION_REQUIRED**
   (removing it is a public wire-shape change).
2. **`city` and `classification` are published by an explicit owner ruling** of
   2026-09-09, documented in the endpoint. Not defects — but see UI-28: the
   consent screen does not enumerate them.

**Test-hardening gap, reported:** the backend privacy test is a *substring scan*
of the raw JSON for five field names, not a property allow-list, so a new
property whose name is not one of those five would pass silently. There is also
**no contract fixture for either public endpoint**, so the shape guard never
covers them. Class **D** (test-only).

---

## UI-28 — Public visibility status text

**A COPY_ONLY · IMPLEMENTED.** «ملفك ظاهر حاليًا للعموم.» →
«ملفك ظاهر حاليًا في الدليل العام.» (English likewise.) This string was also the
odd one out — the other three visibility strings already said «في الدليل العام».

**The toggle and the status text read the same persisted value.** Verified end to
end: one `consent` prop feeds the switch, its description and the tag; the toggle
is not optimistic; the server writes and re-reads in one request; and the public
directory queries the same column. No cache, no projection table, no second flag
that can drift.

**Two findings reported, not changed:**

1. **`VisibilityConsentDecidedAt` is persisted and served but no UI reads it** —
   it exists to distinguish "never asked" from "declined".
2. ⚠️ **The consent screen never enumerates what gets published.** It says only
   «بياناتك المعتمدة». Given UI-27 confirms that **city** and **classification**
   are published, the consent copy arguably understates the disclosure.
   **BUSINESS_DECISION_REQUIRED** — this is consent scope, not wording.

A second surface (portal home) renders the same state from the same column with
different copy («ظاهر للعموم» vs «ظاهر»). It cannot drift, but it is inconsistent.

---

## Validation

Everything below was run after the final edit.

| Gate | Result |
|---|---|
| `dotnet build` (warnings are errors) | **Succeeded — 0 warnings, 0 errors** |
| `dotnet test` | **380 passed, 0 failed** |
| `npm run typecheck` | **Clean** |
| `npm run lint` | **0 errors** (1 pre-existing `react-refresh` warning in an untouched file) |
| `npm run lint:css` (DC-04, DC-23) | **OK** |
| `npm run test` | **876 passed, 0 failed (58 files)** |
| `npm run build` | **Built** |
| EF model check | **No migration needed** — no entity, `DbContext`, configuration, migration or snapshot file was touched. `ApplicationCodes.cs` is a static constants class. |

**Historical compatibility.** No migration was added, no old migration modified,
no historical data rewritten. Agreement `MergedData` is frozen per version and
read back from storage, so the UI-06 and UI-08 wording changes apply only to
newly frozen versions; existing agreements render exactly as they were signed.
No versioning, hash or audit data was removed from persistence.

### Tests added

- `shared/formatting.test.ts` — formatter behaviour plus three build-failing
  guards against a G-02 relapse.
- `businessReview.2026-10-01.test.ts` — pins the reviewed copy for UI-02, UI-03,
  UI-04, UI-05, UI-08, UI-11, UI-12, UI-17, UI-18, UI-19, UI-20, UI-22, UI-23,
  UI-25 and UI-28, plus the single-noun rule of UI-21/UI-24 and the
  "status vocabulary untouched" rule of UI-04.

No test was written for UI-07, UI-09, UI-13, UI-15 or UI-16: those are not
implemented, and a test asserting the fixed behaviour would be false.

---

## Open decisions, in one place

| # | Decision needed | Blocks |
|---|---|---|
| 1 | Approved agreement template name, version and legal body text (DM-GAP-16) | UI-07 |
| 2 | Should the applicant see `templateVersion` and `contentHash`? | UI-07 |
| 3 | The Academy's approved bank list | UI-09 |
| 4 | What "معتمد" means per service, and may the public payload carry the service list? | UI-13 |
| 5 | ~~Is a trainer short bio wanted, who approves it, may it be public?~~ **Decided 2026-10-05 (`P-331`)**: AI-drafted from the CV, trainer confirms, trainer-management employee approves, public with consent. **Built** — the AI step waits on `Q28`, the rest works now | UI-15 |
| 6 | Who populates `TRAINER_RECORD`, and from where? | UI-16, UI-14 |
| 7 | The specialization taxonomy (`specialtiesRepresented` is always 0) | UI-14 |
| 8 | «ارتباط» or «إسناد» for the engagement? | UI-22, UI-23 |
| 9 | One CTA label with one visible control, or two distinct labels? | UI-03 |
| 10 | Align Portal Home's card labels with My Applications? | UI-01, UI-04 |
| 11 | Should the consent screen enumerate what gets published (city, classification)? | UI-28 |
| 12 | Remove the raw `TRAINER_RECORD` id from the public profile payload? | UI-27 |
| 13 | Latin digits in `Pagination` — Design System owner | UI-14 |
