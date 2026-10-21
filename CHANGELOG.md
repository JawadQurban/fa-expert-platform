# Changelog

Notable changes to Expert Hub. The format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow
[Semantic Versioning](https://semver.org/).

The history before this repository existed is in
[`docs/archive/CHANGELOG-before-extraction.md`](docs/archive/CHANGELOG-before-extraction.md).

---

## [Unreleased]

### Added

- **The FAST Training API is connected (INT-05, `P-356`–`P-361`).** FAST published
  a Training API for Expert Hub (27 operations; contract in
  `tools/fast-api/training-swagger-v1.json`, register in
  `docs/integrations/fast-training-api-register.md`). It is off until
  `EXPERT_HUB_FAST_TRAINING_API_BASE_URL` is set, and uses the FAST service
  credential with scope `ims_training_api`. With it:
  - **A general or private programme request can be linked to a FAST plan (RUN-030,
    BUG-004).** The form lists FAST's approved programmes with an upcoming plan,
    then the programme's open plans; the plan fills the programme name, days,
    dates, period, delivery mode, city, language, trainee level and client, and
    those fields are locked. A closed, final-closed, cancelled or ended plan is
    refused. The programme's FAST prospectus (up to 50 MB) can stand in for the
    brochure. **Once the Training API is configured, forms 1–2 cannot be
    submitted without a FAST plan** (`400 fast-plan-required`, owner ruling,
    `P-362`); without it they stay manual.
  - **A content-development request (form 4) may pick a FAST programme**, no plan;
    its name and trainee level are filled and locked (`P-363`). «مجال التخصص» keeps
    Expert Hub's own list.
  - **The trainer is assigned to the FAST plan when they confirm, and removed when
    the engagement ends** (B-07, B-08); **approved training material is sent to the
    plan** (B-09).
  - **The trainer's engagement page shows FAST's enrolled trainees, attendance per
    day, the Teams link and the MTM evaluations** (B-10, B-11, B-12). FAST moving a
    plan's dates updates the engagement; FAST cancelling it ends the engagement as
    cancelled with FAST's reason.
  - **Programmes a trainer delivered with the Academy come from FAST** (B-14) into
    their Academy record, which the trainer file and the public directory show.
  - **FAST's 14 training lookups are synchronized daily** (B-15). Migrations
    **M49** (the lists) and **M50** (`TRAINER_RECORD.fast_plan_id`).
  - Still blocked, because the Training API has no operation for them: Yaqeen
    accounts (B-02), another person's profile (B-13), speaker email and history
    (B-16, B-17), events and exams, cities, and countries (still read from the
    portal API).
- **Uploaded documents can be stored in Azure Blob Storage (`P-370`, ADR-0002).**
  Setting `EXPERT_HUB_STORAGE_PROVIDER=AzureBlob`, with the container name and
  the connection string (in `env/api.secrets.env` only), sends new uploads to a
  **private** container. Downloads still go through the API, with the same
  permission checks, content type, `nosniff` and inline preview. Files uploaded
  before the switch are still read from the documents volume. The API refuses
  to start when AzureBlob is selected without a connection string.
  `/health/ready` reports a `storage` check, which fails if the container is
  public. A storage outage returns 503. New dependency: `Azure.Storage.Blobs`
  12.27.0. The default stays `Local`, which changes nothing.

- **Staff can set a trainer file's status by hand (RUN-025, `F-0411`, `P-354`).**
  The comprehensive trainer file has a «ضبط حالة الملف» panel for viewers holding
  F-0411: choose a status (or «تلقائية» to follow the agreement again) and give
  a reason. The manual status wins over the agreement-derived one until changed,
  is followed by matching and the directory, and is written to the audit log.
  Migration M48 adds `TRAINER_PROFILE.file_status_override`.
- **Staff can register an applicant again (J-02, `P-350`).** «تسجيل متقدّم جديد» on
  the application inbox finds an existing user by user id, name or email, and
  opens the same application form on their behalf. The application is in the
  nominee's name, records who nominated them, and enters screening on
  submission; the nominee is notified (EV-0102). A staff member cannot nominate
  themselves, and an accredited trainer is pointed to add-service instead.
- **Notification email is sent through the Academy's Notifications Gateway**
  (INT-04, `NotifyByEmail`, HTTP Basic). It takes over from the null gateway
  once `EXPERT_HUB_EMAIL_GATEWAY_URL`, `EXPERT_HUB_EMAIL_USERNAME` and
  `EXPERT_HUB_EMAIL_PASSWORD` are set; the password goes in
  `env/api.secrets.env`. Arabic emails are sent right-to-left. A failed send is
  recorded in `NOTIFICATION_LOG` and retried by the outbox. (It replaced a
  direct SMTP sender the same day: SMTP port 25 is closed from the server.)

- **Speaker records (J-04, `P-346`–`P-349`).** Staff create, edit and search
  speaker records from the internal dashboard («سجل المتحدثين»), with the 11
  fields of the owner's Speaker Record matrix: photo, title, four name parts in
  Arabic and in English, and bio. Search is by name or title. Speakers also
  appear in the trainer database search, tagged «متحدث». Migration **M43** adds
  `SPEAKER_RECORD`. Not yet working, because FAST does not provide the data:
  the speaker's email (read from their FAST profile, so the creation email is
  not sent) and their participation history. Both are now items B-16 and B-17
  of the FAST contract.

### Changed

- **No screen names FAST any more (`P-371`).** Engagements, slot re-routing,
  execution, speakers, submissions and withdrawal now say what the thing is
  («أُلغيت الخطة», «حالة المزامنة», «غير مرتبط بخطة», «رمز سبب إلغاء الخطة»)
  instead of «في نظام FAST». The integration console and server logs still name
  the system, since that is what operators need there.

- **The assignment request form shows errors only, and never names FAST (`P-371`).**
  The «هذا الطلب يصف الاحتياج فقط…» note, the picker's intro, the «عُبّئت بيانات
  الخطة من فاست» confirmation, the prospectus hint and the "FAST unavailable" note
  are gone; the labels read «البرنامج والخطة» / «البرنامج». The rule itself (the
  request creates nothing in FAST, J-16 F2/AC-3) is unchanged.
- **The programme field is searchable in place.** The separate search box is gone:
  you type in «البرنامج» itself and the list narrows as you type (name or code).
  The list loads FAST's full page (200, was 50) once.
- **Design system: `Select` gains `searchable` and `onSearchChange`** (WAI-ARIA
  APG editable combobox with list autocomplete). Off by default, so every other
  dropdown is unchanged. _Needs Confirmation:_ no live Figma check — the Figma
  MCP was not connected; it reuses the Dropdown Input's trigger and panel as they are.

- **A consultant's scheduling conflict lowers their score instead of excluding
  them** (owner ruling, 2026-10-20). Matching gains a sixth weighted row,
  «عدم تعارض المواعيد» (`availability`, weight 33, migration **M47**). For every
  other service a conflicting engagement still excludes; the two exclusions
  remain the conflicting engagement and an inactive file (`BUG-038`).
- **The staff home lists declined assignment offers (`BUG-047`, J-22).** Each row
  names the request, the seat and the trainer who declined, and says whether
  the nomination moved to the next candidate or the matching engine has to run
  again. It is derived from the offers, so it works before CAP-07 routes
  EV-0502, and a centre coordinator sees only their own centre's (`P-351`).
- **A centre coordinator works within their own centre (`P-351`).** The
  coordinator's centre is now one of the five assignment centres, chosen in
  access management. They see only their centre's assignment requests, and the
  request form fills in their centre and themselves as the requester, read-only.
  Staff and managers still see every centre.
- **Assignment routing follows Notion's 2026-09-29 update** (`P-341`). A
  «عروض فنية / محاور البرامج» request now asks for «الفئة المطلوبة» — content
  developer or trainer — and is matched against the category picked. The API
  requires the choice for that type and refuses a category a type does not
  route to. Workshop, meeting and seminar still route to trainer until the
  Speaker record (J-04) exists.
- The question-writing form (form 5) labels its attachment «المادة».
- **New application form version `dm-gap-01.2026-10-07` and evaluation model
  `dm-gap-02.2026-10-07`** (`P-342`, migration `M41`). «المجال» offers «أخرى»
  with a mandatory «المجال (أخرى)» text field, and criterion #3 pays 0 for it.
  «هل سبق لك التدريب أو التحدث في فعاليات؟» is mandatory for the Trainer.
  A new mandatory «القطاع» field offers التمويل، التأمين، البنوك، الأوراق المالية.
  Earlier drafts, applications and decided scores keep their own versions.
- **The Identity Card follows Notion's 2026-09-29 layout** (`P-343`): a
  front cover (photo, name, every professional certificate, LinkedIn) and an
  inner panel — overview (sector, activity types), experience (years and the two
  most recent roles), degree / university / year of the highest qualification,
  and related fields (services, forum participation, field/domain).
- **A full committee no-show no longer dead-ends the interview** (`P-344`,
  migration `M42`). When every member marks «did not attend», the screening
  decision-maker can reschedule — as often as needed — or reject; after such a
  reschedule, rejection stays available before the new interview happens.
- **A service request with no active agreement is rejected automatically**
  (`P-345`, RB-03). On submission the trainer is told to renew their agreement
  first; on review the decision-maker cannot approve it, and the only action
  records the automatic rejection, with a link to agreement management.
- **F-0105 and F-0413 carry the BRD's names** — «إدخال بيانات متحدث» and
  «إدارة سجل المتحدث» — and **F-0105 moves from the Trainer role to Staff and
  Manager** (M43). The Trainer grant would have let a trainer create a speaker
  record, which `BR-0113` forbids. Nothing used F-0105 before.

### Fixed

- **The interview pass mark no longer forces a rejection (BUG-033, `P-355`).**
  Forwarding to the approval committee stays available when no service reached
  the pass mark, and a service below it is no longer closed on forwarding: the
  committee sees every service with its result and decides. Rejection is only
  ever the decision-maker's choice.
- **The screening decision card lists exempted services and shows a later
  rejection (RUN-034).** A service exempted from the interview now counts as
  accepted, so the card no longer reads «قُبلت الخدمات التالية: .» with an empty
  list. Once the decision-maker rejects directly after the interview, the card
  shows that rejection and its reason instead of the original acceptance.
- **The applicant is told the interview was exempted (BUG-034, `P-352`).** The
  timeline's interview step reads «مستثنى من المقابلة» / "Exempted from
  interview" instead of looking like a passed interview. The exemption reason is
  still not shown to the applicant.
- **«عدد سنوات الخبرة» is mandatory only while «أعمل حاليًا» is off (RUN-019,
  user ruling 2026-10-20).** Form version `dm-gap-01.2026-10-19` (M46, corrected
  in place — not yet deployed) had made it always mandatory. A new schema rule,
  `requiredWhen`, makes a visible field mandatory only while a condition holds;
  the form and the API's submit gate both read it. Criterion #4 scores a
  missing answer as 0.
- **Bank country is a dropdown, and the IBAN follows it (RUN-026, J-09).**
  «دولة البنك» lists FAST's countries (`reference-data/fast-country`) and the
  API refuses a name outside that list; free text remains only while no copy
  of the list exists. Saudi Arabia keeps "SA" + 22 digits; any other country is
  checked by ISO 13616 — its own country code, 15–34 characters, mod-97.
  «مدينة البنك» stays free text: the repository holds no Saudi city list.
- **Every live application submission failed with «تعذّر تقديم الطلب»**
  (`400 Application is incomplete.`), whatever the applicant filled in. The form
  sends a repeatable section's answers (education, certifications, experience)
  in `entries`, and the server's `BR-0105` gate judged those fields against the
  flat `values`, which never hold them. The gate now judges them per entry, the
  way `validateCompleteness` does on the client, and reports a failure as
  `entryId::fieldId`.
- **A per-entry file was required for a section with no entries.** The
  professional-certificate file was demanded from an applicant who listed no
  certificate. A per-entry rule now applies only when its section has an entry.
  ⚠️ Attachments still don't record which entry they belong to, so the server
  checks one file per *rule*, not one per entry.
- Saving the profile no longer demands a field the trainer cannot see (a
  conditional field whose condition is unmet).
- **The favicon is the Academy logo, and a new one actually shows.** It is
  bundled from `src/assets/branding/favicon.svg`, so the build fingerprints it
  (`assets/favicon-<hash>.svg`, cached as immutable). In `public/` it kept one
  URL, `/expert-hub/favicon.svg`, so browsers went on showing the old icon after
  a redeploy.
- **An accredited trainer is no longer sent to a dead end** (J-01/F3/AC-4 →
  J-03, found in hands-on testing: «يوجهه بس مافيه زر اضافة خدمة»). Starting a
  new application as an accredited trainer showed «إضافة خدمة من ملفي», which
  opened My Profile, where there is no add-service entry. `POST
  v1/me/applications/draft/start` now returns the trainer's approved or active
  application as `blockedByApplicationId`, and the button («إضافة خدمة») opens
  that application's add-service form. A trainer accredited outside Expert Hub
  has no such application, so no button is shown and My Applications remains
  the exit.

## [1.4.1] — 2026-10-06 — The business-review decisions (`P-333`–`P-340`)

The owner answered the 13 open decisions from the 2026-10-01 review. This work
was done in the previous repository's working tree on the same day, and was
ported here before the first deployment from this repository.

- **The agreement is a file uploaded per trainer** (`P-333`). At preparation the
  creator uploads that trainer's agreement (PDF/DOC/DOCX, 1 MB); the signers and
  the applicant read and sign that file, and its SHA-256 is the version's hash.
  The DM-GAP-16 placeholder text no longer reaches anyone. The trainer can
  download their file once it is sent to them.
- **Template version and hash are staff-only** (`P-334`); the applicant's
  document wire no longer carries them.
- **The public profile publishes exactly** name, field, short bio, programmes
  delivered, personal photo and classification (`P-335`). City is no longer
  public; the photo is new, served by `GET v1/directory/{id}/photo` (consenting,
  listable trainers only; images only). The «معتمد» badge is gone from the card
  (classification shows as text). The raw `TRAINER_RECORD` id left
  `deliveredPrograms`. The consent screen lists the six items. The backend
  privacy test is now a property allow-list on both public endpoints.
- **Wording** (`P-339`): one «تقديم طلب جديد» button on an empty My
  Applications; Portal Home's cards use My Applications' labels.
- **Pagination** (`P-340`): already renders Latin digits — the review was
  wrong; a Design System test now pins it (test-only change).
- No change, by ruling: bank name stays free text (`P-336`); «إسناد»/«ارتباط»
  kept (`P-339`). Waiting: programmes delivered from FAST (`P-337`, no FAST
  endpoint), the specialization list (`P-338`).
- The FA portal API register (`docs/integrations/fast-portal-api-register.md`) is
  generated from the saved swagger by `tools/fast-api/build-register.py`
  (353 operations).

Migration **M40** (additive: `AGREEMENT.document_attachment_id`,
`AGREEMENT_DOCUMENT_VERSION.attachment_id`).

---

## [1.4.0] — 2026-10-06 — Own repository

Expert Hub was extracted from `financial-academy-hackathon` (commit `15bbe0c`)
into this repository. Its behaviour is unchanged: the same API, the same
database and migrations (M01–M39), and the same container and volume names, so
an existing deployment switches over without data loss.

### Changed
- **Layout.** `backend/expert-hub` → `backend/`, `deploy/expert-hub` →
  `deploy/`, and the SPA (`frontend/src/apps/expert-hub`) is now the root of
  `frontend/src/`. There is one Vite config, one `index.html`, and the output
  is `dist/`.
- **npm scripts.** The `:expert-hub` variants are now plain `dev`, `build`,
  `test`, `lint`, `typecheck` and `validate`.
- **Docs** are grouped by purpose: `specification/`, `journeys/`
  (the Notion exports, renamed `J-NN-<title>.md`), `inputs/` (the business
  workbooks, with readable names), `operations/`, `reviews/`, `integrations/`,
  `design-system/`, `adr/` and `sessions/`. Superseded material is in
  `archive/`.
- **Data tools** moved from `docs/` to `tools/data/`.
- **CI** runs from the repository root: the frontend validates and builds, and
  the backend builds.

### Removed
- The Innovation Hackathon application, its handoff bundle and its working
  material, along with the import boundary that kept the two products apart.

## [1.3.x] — 2026-10-05 — Last releases in the previous repository

The trainer short bio (`P-331`), Claude for every AI use case (`P-332`),
concurrency claims and M37/M38, the 2026-10-01 business review, and FAST
service-to-service authentication. See the archived changelog for the details.
