# Changelog

Notable changes to Expert Hub. The format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow
[Semantic Versioning](https://semver.org/).

The history before this repository existed is in
[`docs/archive/CHANGELOG-before-extraction.md`](docs/archive/CHANGELOG-before-extraction.md).

---

## [Unreleased]

### Changed

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

### Fixed

- Saving the profile no longer demands a field the trainer cannot see (a
  conditional field whose condition is unmet).
- **The favicon is the Academy logo, and a new one actually shows.** It is
  bundled from `src/assets/branding/favicon.svg`, so the build fingerprints it
  (`assets/favicon-<hash>.svg`, cached as immutable). In `public/` it kept one
  URL, `/expert-hub/favicon.svg`, so browsers went on showing the old icon after
  a redeploy.

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
