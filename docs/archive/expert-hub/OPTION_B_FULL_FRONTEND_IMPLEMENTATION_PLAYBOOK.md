# Option B — Full Frontend Improvement & User Journey Playbook

## 1. Mission

Implement the approved **Option B — Modern Operational Dashboard** visual language and user-experience approach across the **entire frontend application**, not only the dashboard page.

This is an implementation task. Begin work immediately after completing the minimum repository and page inventory needed to implement safely.

The objective is to:

- modernize every frontend page;
- create one consistent operational experience;
- improve navigation, hierarchy, clarity, discoverability, feedback, responsiveness, and accessibility;
- preserve every existing feature and functional contract;
- use the existing `@ds` implementation as the code source of truth;
- keep production `@ds` read-only unless separate explicit approval is provided.

The approved Option B artifact is the visual and UX reference:

`https://claude.ai/code/artifact/ca01bb25-ea7a-4ccd-9754-d2412324197d`

The existing proposed-component registry is the specification for identified gaps:

`docs/expert-hub/PROPOSED_COMPONENT_REGISTRY.md`

---

## 2. Non-Negotiable Preservation Rules

This frontend improvement must **not change or break**:

- business logic;
- calculations;
- API endpoints, payloads, response handling, or contracts;
- backend integrations;
- authentication or authorization behavior;
- roles and permissions;
- routes, route parameters, query parameters, or deep links;
- state-management behavior or persisted state;
- validations and business rules;
- workflow transitions or status definitions;
- feature availability;
- data ownership;
- analytics events or audit behavior;
- localization keys or translation behavior;
- existing error-handling rules.

Do not delete, hide, merge, rename, or replace a feature merely to simplify the design.

If an existing behavior is unclear, preserve it and document the uncertainty. Do not invent a new rule.

Changes are limited to the presentation and interaction layer unless a minimal refactor is essential to render the approved experience. Such a refactor must remain behaviorally equivalent.

---

## 3. Sources of Truth

Apply the following order:

1. **Existing application:** functionality, workflows, APIs, routes, permissions, validation, and business behavior.
2. **Approved Option B artifact:** visual direction, interaction model, information hierarchy, operational layout, and journey principles.
3. **Existing `@ds`:** production components, tokens, styles, variants, accessibility behavior, and code conventions.
4. **Proposed Component Registry:** specifications for gaps already identified during design.
5. **Existing tests and documentation:** expected behavior and regression protection.

When sources appear to conflict, preserve application behavior and use Option B to improve how that behavior is presented.

---

## 4. Scope

The scope includes **all frontend pages and states**, including:

- public pages;
- authentication-related pages;
- landing and dashboard pages;
- trainer portal pages;
- internal staff pages;
- administration and configuration pages;
- list, table, search, and filter pages;
- detail and master-detail pages;
- create, edit, and multi-step forms;
- application and approval journeys;
- modal, drawer, confirmation, and destructive-action flows;
- profile, settings, notification, and help pages;
- unauthorized, not-found, and system-error pages;
- loading, skeleton, empty, no-results, partial-data, success, warning, and failure states;
- desktop, tablet, and mobile layouts;
- Arabic RTL and English LTR.

Include pages that are role-gated or not directly linked in the primary navigation. Use the router and route configuration as the authoritative page inventory.

---

## 5. Target Experience: Option B Everywhere

Option B is a **product-wide experience language**, not a dashboard template that should be copied literally onto every page.

Apply these principles consistently:

- persistent and predictable application navigation;
- clear page title, context, breadcrumbs, and primary action;
- action-oriented layouts optimized for daily work;
- visible status, ownership, urgency, and next step;
- concise KPI or summary information only where it supports a decision;
- reusable filter and saved-view patterns for operational lists;
- clear work queues for items requiring attention;
- progressive disclosure for secondary information;
- drawers or contextual panels when they reduce unnecessary page switching;
- strong loading, empty, success, warning, and error feedback;
- consistent spacing, density, cards, tables, forms, actions, and status treatments;
- status must never be communicated by color alone;
- reduced cognitive load without removing information or capability.

Do not force dashboard widgets onto transactional pages. Translate Option B appropriately for each page type.

---

## 6. Page-Type Patterns

### 6.1 Dashboard and Landing Pages

Use:

- operational KPI tiles;
- active filters or scope controls;
- work queues and items needing action;
- SLA or health summaries where applicable;
- alerts and recent activity;
- clear drill-down links;
- role-relevant quick actions.

### 6.2 List and Data Pages

Use:

- page header with purpose, count, and primary action;
- search, filter bar, active filter chips, reset, and result count;
- saved views only when they provide real recurring value;
- sortable and accessible tables or suitable responsive cards;
- explicit status and row actions;
- pagination and selection state;
- no-results and empty-state distinction;
- mobile patterns that preserve critical actions and content.

Do not add bulk actions unless the existing product already supports the underlying operation.

### 6.3 Detail Pages

Use:

- clear identity and status header;
- primary and secondary actions based on permissions and current status;
- summary information before supporting detail;
- sections or tabs based on information architecture;
- activity/history where it already exists;
- contextual next steps;
- sticky actions only when they improve completion and remain accessible.

### 6.4 Forms and Multi-Step Journeys

Use:

- meaningful page title and instructions;
- logical grouping and progressive disclosure;
- clear required/optional fields;
- inline validation using existing validation rules;
- preserved values after errors;
- explicit cancel, save, continue, back, submit, and completion behavior;
- step indicator for genuine multi-step workflows;
- review step where already supported or needed to clarify the existing process;
- success confirmation and next action.

Do not change field requirements, validation rules, submission payloads, or workflow order.

### 6.5 Administration and Configuration

Use:

- clear separation between configuration categories;
- scope and impact explanations;
- permission-aware controls;
- confirmation for high-impact actions;
- success/error feedback;
- visible current configuration state;
- accessible tables, forms, or master-detail composition according to density.

---

## 7. Component Implementation Rules

Use this priority for every interface element:

1. existing `@ds` component;
2. existing `@ds` variant;
3. composition of existing `@ds` components;
4. existing shared application component;
5. approved application-level component based on the proposed registry;
6. page-only composition;
7. proposed global DS component only after explicit approval.

Do not:

- modify production `@ds` files;
- add another UI framework;
- recreate an available `@ds` component with custom HTML/CSS;
- introduce arbitrary colors, spacing, typography, shadows, or radii;
- promote page-specific elements into the global design system;
- silently approximate a proposed component without following its specification.

Initially expected Option B patterns include:

- App Sidebar Navigation;
- Filter Bar;
- Saved View Selector;
- Filter Chip;
- KPI Tile;
- Trend Indicator;
- SLA Health Meter;
- Work-Queue Row;
- Alerts Feed.

Confirm each component's existing classification and implementation status before creating code.

---

## 8. Required Execution Process

### Phase 1 — Establish the Baseline

Before modifying code:

1. Read `CLAUDE.md`, project instructions, frontend architecture documentation, `@ds` documentation, and the proposed component registry.
2. Inspect the router and generate a complete route/page inventory.
3. Identify application shells, role-based layouts, shared components, and page templates.
4. Map each page to its APIs, hooks, stores, permissions, actions, validations, and tests.
5. Run the existing build, lint, type-check, and test commands to establish the baseline.
6. Record existing failures separately so they are not incorrectly attributed to this implementation.

Do not spend this phase proposing more alternatives. Its purpose is safe execution.

Create or update:

`docs/expert-hub/OPTION_B_FRONTEND_ROLLOUT.md`

The rollout record must contain:

| Page/Route | Role | Page Type | Current Features | APIs/State | Option B Changes | Risk | Status |
|---|---|---|---|---|---|---|---|

### Phase 2 — Build the Shared Foundation

Implement the common experience first:

- role-aware application shell;
- responsive sidebar/navigation behavior;
- page-header pattern;
- shared content/container rules;
- common filter/search patterns;
- status presentation;
- feedback states;
- shared loading, empty, no-results, and error patterns;
- responsive utilities required by the approved design.

Preserve the existing route tree and permission checks.

### Phase 3 — Implement by Journey, Not Random Files

Work in coherent vertical slices. Recommended order:

1. global shell and navigation;
2. dashboard/landing experience;
3. highest-frequency operational list and detail journey;
4. create/edit/application forms;
5. remaining trainer journeys;
6. remaining internal staff journeys;
7. admin/configuration journeys;
8. public and authentication journeys;
9. system and exceptional states.

For each journey:

1. trace the current end-to-end behavior;
2. record critical invariants;
3. implement the Option B presentation;
4. keep data hooks and service calls intact where possible;
5. test all roles, states, actions, and responsive layouts;
6. compare the result with the approved design language;
7. mark the journey complete only after validation.

### Phase 4 — Cross-Application Consistency Pass

After all journeys are implemented, normalize:

- headers and breadcrumbs;
- navigation labels and active states;
- action placement and button hierarchy;
- filters and chips;
- forms and validation feedback;
- tables and pagination;
- status and urgency patterns;
- cards and section spacing;
- loading, empty, no-results, error, and success states;
- drawers, dialogs, focus behavior, and overlays;
- desktop, tablet, and mobile behavior.

Remove obsolete presentation code only after confirming it is unused and has no behavioral responsibility.

---

## 9. User-Journey Improvement Rules

For every journey, explicitly validate:

- Can the user understand where they are?
- Is the next valid action clear?
- Are unavailable actions explained or correctly hidden by existing permissions?
- Is status understandable without relying on color?
- Are errors placed near the source and explained constructively?
- Does the user retain entered data after a recoverable failure?
- Is successful completion confirmed?
- Is there a clear next step after completion?
- Can keyboard and screen-reader users complete the journey?
- Does the journey remain usable on mobile?
- Does Arabic read naturally in RTL, including mixed Arabic/English values?

Improve labels, grouping, helper text, feedback, and action priority when this does not change the business meaning. Preserve localization architecture and add/update translation keys for all user-facing text.

---

## 10. RTL, LTR, and Responsive Requirements

Arabic RTL is a primary layout, not a mirrored afterthought.

Validate both directions for:

- shell and sidebar;
- navigation and breadcrumbs;
- page headers and actions;
- filters and chips;
- tables and pagination;
- drawers and dialogs;
- forms and validation;
- charts and directional icons;
- mixed Arabic/English content;
- dates, numbers, codes, email addresses, and identifiers.

Prefer logical CSS properties such as:

- `margin-inline-start` / `margin-inline-end`;
- `padding-inline-start` / `padding-inline-end`;
- `inset-inline-start` / `inset-inline-end`;
- `border-inline-start` / `border-inline-end`;
- `text-align: start` / `text-align: end`.

Responsive behavior must be intentional at desktop, tablet, and mobile widths. Do not solve mobile layouts by hiding important features.

---

## 11. Accessibility Requirements

Target WCAG 2.2 AA.

Validate:

- semantic landmarks and heading hierarchy;
- keyboard navigation and visible focus;
- focus order and focus restoration;
- accessible names and form labels;
- error identification and instructions;
- contrast and non-color status cues;
- minimum target sizes;
- dialogs/drawers with correct focus containment and Escape behavior;
- screen-reader announcements for async updates and toasts;
- table semantics and accessible sorting/selection;
- reduced-motion behavior;
- charts with meaningful text alternatives.

Do not remove an accessibility behavior already supplied by `@ds`.

---

## 12. Functional Regression Guardrails

Before changing a page, identify and protect:

- service calls and request parameters;
- cache/query keys;
- mutations and invalidation behavior;
- form schemas and validators;
- permission checks;
- route transitions and deep links;
- URL-driven search/filter/pagination state;
- event handlers and side effects;
- download/export behavior;
- file upload behavior;
- analytics and audit events;
- optimistic updates and rollback behavior;
- error mapping and notifications.

Do not replace stable functional code simply because a visual refactor makes rewriting it convenient.

Add regression tests when the visual restructuring risks disconnecting behavior from the interface.

---

## 13. Validation Matrix

Every route must be validated against the following matrix where applicable:

| Dimension | Required Coverage |
|---|---|
| Roles | Every permitted and restricted role |
| Direction | Arabic RTL and English LTR |
| Viewport | Desktop, tablet, and mobile |
| Data | Normal, long content, minimum, and large dataset |
| Async | Loading, success, partial, retry, and failure |
| Lists | Populated, empty, no results, filtered, paginated |
| Forms | Default, invalid, valid, submitting, server error, success |
| Permissions | Allowed, read-only, hidden, unauthorized |
| Interaction | Mouse, keyboard, focus, touch where relevant |

Use realistic application data. Do not rely only on ideal happy-path fixtures.

---

## 14. Required Technical Checks

After each implementation slice, run the relevant targeted tests.

Before completion, run the project's actual commands for:

- TypeScript/type checking;
- linting;
- unit/component tests;
- integration tests;
- end-to-end tests, if configured;
- production build;
- runtime smoke test.

Also check:

- browser console errors;
- failed or duplicated network requests;
- broken links and routes;
- uncaught promise errors;
- missing translation keys;
- layout overflow;
- hydration/runtime warnings if applicable;
- obvious performance regressions.

Do not claim success when required checks were not run. Report blockers and pre-existing failures precisely.

---

## 15. Definition of Done

The work is complete only when:

- every frontend route is inventoried;
- every in-scope page follows the Option B experience language;
- all existing features remain available and functional;
- APIs and business logic remain behaviorally unchanged;
- routes, permissions, validation, and state behavior are preserved;
- production `@ds` remains unchanged unless separately approved;
- shared patterns are reused rather than duplicated;
- loading, empty, no-results, error, success, and permission states are implemented;
- Arabic RTL and English LTR are validated;
- desktop, tablet, and mobile are validated;
- accessibility checks are complete;
- build and applicable tests pass, excluding clearly documented pre-existing failures;
- the rollout record shows no unreviewed page;
- visual and behavioral deviations are documented.

---

## 16. Final Report

At completion, provide:

### Implemented

- journeys and pages improved;
- shared shell and components added or updated;
- major user-journey improvements.

### Preserved

- confirmation that APIs, routes, permissions, validation, state management, features, and business logic were retained;
- any unavoidable behavior-level changes, each requiring explicit justification.

### Component Usage

- existing `@ds` components used;
- compositions created;
- application components created;
- proposed components implemented;
- any registry gaps still awaiting approval.

### Validation Results

- type check;
- lint;
- tests;
- build;
- runtime smoke test;
- Arabic RTL;
- English LTR;
- responsive layouts;
- accessibility;
- roles and permissions.

### Deviations and Follow-Ups

- deviations from Option B;
- pre-existing issues;
- blocked pages or states;
- recommended follow-up work that is outside this scope.

---

## 17. Master Execution Prompt

Copy the following instruction into Claude Code from the frontend repository root:

> Implement the approved **Option B — Modern Operational Dashboard** experience across the complete frontend application.
>
> Follow `OPTION_B_FULL_FRONTEND_IMPLEMENTATION_PLAYBOOK.md` as the mandatory execution and acceptance guide. Use the approved Option B artifact and `docs/expert-hub/PROPOSED_COMPONENT_REGISTRY.md` as design references.
>
> This is implementation work. Do not produce another design assessment and do not create more design alternatives. Begin by reading the repository instructions and building the complete route/page inventory required by the playbook, establish the current test/build baseline, then implement the improvements in coherent journey-based phases.
>
> Preserve all existing features, APIs, API contracts, business logic, calculations, routes, permissions, roles, validations, workflows, state management, integrations, analytics, and localization behavior. Do not remove or simplify functionality. Do not modify the backend.
>
> Treat the current application as the functional source of truth, the approved Option B artifact as the UX/visual direction, and the existing `@ds` package as the production component and token source of truth. Keep production `@ds` read-only. Prefer existing `@ds` components, variants, and compositions before creating application-level components. Do not add another UI framework or reproduce available DS components with custom CSS.
>
> Apply Option B as a consistent product-wide experience, adapted appropriately for dashboards, lists, details, forms, multi-step journeys, configuration pages, public pages, and system states. Improve navigation, hierarchy, discoverability, action clarity, operational status, feedback, responsiveness, accessibility, Arabic RTL, and English LTR.
>
> Maintain `docs/expert-hub/OPTION_B_FRONTEND_ROLLOUT.md` as the page-by-page control record. Do not mark a route complete until its features, states, roles, RTL/LTR behavior, responsive behavior, and applicable tests have been verified.
>
> Work through the implementation autonomously in controlled batches. After each journey, run targeted checks. At the end, run all available type-check, lint, test, build, and runtime validation commands and provide the final report required by the playbook. Do not stop after implementing only the dashboard or shared shell; continue until all frontend pages and journeys are complete or a genuine blocker is identified.

---

## 18. Golden Rules

1. **Implement Option B across all pages, but adapt it to the page's purpose.**
2. **Improve presentation and journey quality without changing business behavior.**
3. **Never trade a working feature for a cleaner screen.**
4. **Use `@ds`; do not create a parallel visual system.**
5. **Keep production `@ds` read-only without separate approval.**
6. **Implement by complete journeys, not disconnected screenshots.**
7. **Treat Arabic RTL as a primary experience.**
8. **Validate permission and failure paths, not only happy paths.**
9. **Do not declare completion while any route remains unreviewed.**
10. **The final product must look consistently Option B while behaving exactly like the established application.**
