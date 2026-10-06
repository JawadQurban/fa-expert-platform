# Project Overview

**Function:** The business description of this project. Why it exists, what
problem it solves, who it's for. This is the file an AI agent (or a new
teammate) should read first to understand *why* before touching *how*.

---

## What this project is

**Expert Hub** (`BRD-TRN-001`) — the Saudi Financial Academy's Expert &
Independent Trainer Management Platform. It carries the whole lifecycle of the
Academy's relationship with an independent expert: application, screening,
interview, committee accreditation, agreement, assignment, engagement execution,
and financial entitlements.

It follows the Saudi DGA Platforms Code, is Arabic-primary and RTL by default,
and targets WCAG 2.2 AA. Its UI is built on FADS, the Financial Academy Design
System, which lives in this repository at `frontend/src/design-system/`.

## Problem it solves

The Academy's record of its trainers lives in spreadsheets and disconnected
systems. Evaluation differs between reviewers, every coordination step is
re-done by hand, and nobody can answer "who is accredited for this, and are they
available" from one place. Expert Hub replaces that with a single governed
record: one accreditation path with a scored matrix behind it, state the system
moves rather than people chase, and a trainer directory the business can trust.

## Pages

Three interfaces over one core (`docs/specification/04_SCREEN_INVENTORY.md`,
`11_JOURNEY_IMPLEMENTATION_MAP.md`):

- **Trainer portal** — application submission, my applications, my profile,
  my offers and engagements, agreement signing, public-visibility consent.
- **Internal dashboard** — the application inbox, screening and decision,
  interview scheduling and evaluation, committee decision, agreement preparation
  and lifecycle, trainer search, assignment requests, matching and offers,
  entitlements, the notification and SLA console, access administration,
  analytics.
- **Public** — the marketing landing page and the consent-gated trainer
  directory, both anonymous.

## Roles

Staff roles, all of which carry the coarse `internal` session role
(`docs/specification/01_PRODUCT_DISCOVERY.md` §4, `RoleCode`):

| Role | Arabic |
|---|---|
| Trainer management employee | موظف إدارة المدربين |
| Trainer management manager | مدير إدارة المدربين |
| Centre coordinator | منسق مركز |
| System administrator | مشرف النظام |
| Senior management | الإدارة العليا |

External and non-staff:

- **Trainer / expert** (مدرب) — the portal's user.
- **Individual** — granted to everyone who signs in; it is *not* staff, and
  nothing grants internal access by itself.
- **Speaker** (متحدث) — a record type, not a permission role; no portal access.
- **Public visitor** (زائر) — unauthenticated.

## Feature By page

Features are governed per role by the CAP-08 permission matrix (`PERMISSION`,
`ROLE_PERMISSION`), keyed `F-xxyy` where `xx` is the capability — for example
`F-0602` is the staff view of anyone's entitlements, and `F-0802` is assigning
roles to users. A route is gated by `.RequireFeature("F-xxxx")`, so the matrix in
the database decides, never the code. The twelve capabilities are CAP-01
applications, CAP-02 screening and evaluation, CAP-03 agreements, CAP-04 trainer
profile, CAP-05 assignment and matching, CAP-06 entitlements, CAP-07
communication, CAP-08 access and permissions, CAP-09 analytics, CAP-10 public
presence, CAP-11 professional community (deferred), CAP-12 integration.

## Target user

The Trainer Management department of the Academy, who operate the accreditation
and assignment process day to day, and the independent trainers and experts who
apply to the Academy and take its engagements.

## Stakeholders

Named individuals are not recorded in the repository; these are the roles the
documents name: the Trainer Management department as business owner, the
screening manager and the accreditation committee as decision owners, the system
administrator for the access matrix, senior management for oversight, and the
Academy's site/identity team as the INT-01 owner.

_Needs confirmation: the named business owner, tech lead and reviewers._

## Source documents

- `docs/inputs/BRD-TRN-001-expert-hub-v1.0.pdf` — `BRD-TRN-001 v1.0`, the
  authoritative business source. Still an initial draft pending formal approval.
- `docs/inputs/trainer-application-form.xlsx` and
  `certification-master-list.xlsx` — the form and certification
  inputs.
- The FAST field inventory supplied 2026-08-23 (15 tables, 406 fields), mapped in
  `docs/specification/13_FAST_DATA_DICTIONARY_MAP.md`.
- The official Platforms Code Figma component library — the fixed visual source
  for the design system, resolved through
  `frontend/src/design-system/registry/figma-component-map.json`.
- The numbered specifications in `docs/` are derived from the above;
  `DECISIONS.md` records the rulings (`P-xxx`) and `docs/sessions/`
  the hand-offs.
