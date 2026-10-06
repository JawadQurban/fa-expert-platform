# Expert Hub — منصة الخبراء والمدربين

## Objective

Build and run Expert Hub (`BRD-TRN-001`), the Financial Academy's expert and
independent trainer management platform, to production quality, following the
Saudi DGA Platforms Code.

## Always-loaded context

The files below are imported into every session — present-tense facts about the code
as it is. Everything else (`docs/adr/`, `diary/repo/`, `context/integrations/`,
`docs/`) is read when the task needs it.

@context/project-overview.md
@context/architecture.md
@context/code-standards.md
@context/ui-rules.md

Before touching an area, also read that area's `AGENTS.md` if one exists.

## Development Rules

- Follow DGA standards before making any decision.
- Never invent DGA requirements.
- If a requirement cannot be verified, mark it as "Needs Confirmation".
- Arabic is the primary language.
- RTL is the default layout.
- Follow WCAG 2.2 AA.
- Build reusable components.
- Use semantic HTML.
- Use TypeScript.
- Use React.
- Follow modern React best practices.

## Starting a session

1. Read the newest session record in `docs/sessions/` (see below). It opens with
   a "Resume here" block: the branch, the deployed state, the validation numbers
   and the next action.
2. Treat the repository as the single source of truth, never the previous chat.
3. Read the `AGENTS.md` of any area before touching it (`backend/`, `frontend/`,
   `frontend/src/design-system/`).
4. Before ending a session, update the documentation the change affects and
   write the session record.

## Session Records

Every working session ends with a **session record** — the hand-off that lets the
next session pick the work up without re-deriving anything.

Location: `docs/sessions/`,
named `YYYY-MM-DD--YYYY-MM-DD-short-slug.md`, indexed in that folder's
`README.md`.

**A session record is not a changelog.** `CHANGELOG.md` already records what
shipped and `DECISIONS.md` records what was decided. The record holds the four
things that survive nowhere else:

1. **The narrative** — what was asked, in what order, and why the work went that
   way. Commits show the *what*, never the *why this order*.
2. **Rulings the user gave in conversation** — real constraints that shaped the
   code and are written nowhere else. Quote them **in the user's own language**;
   a paraphrase loses what made it a ruling.
3. **Corrections** — every claim made during the session that turned out to be
   wrong, and what replaced it. This section is mandatory and is never omitted
   because it is unflattering: a future session that re-derives a wrong
   conclusion, because nobody wrote down that it was wrong, has wasted the
   correction. If there were none, write "none" — silence and *nobody checked*
   must not look the same.
4. **Where it stopped** — the exact next action, including any unanswered
   question that blocks it.

Also required: the real validation numbers (run them; never write a test count
you did not just see), the questions grouped by *who can answer them*, and the
environment traps that cost time once and would cost it again.

Use the `session-record` skill (`.claude/skills/session-record/`) — it carries
the full structure and the rules.

## Visual Compliance Rule

The official Platforms Code Figma Component Library is the primary visual reference.

Do not redesign components.
Do not approximate components.
Do not invent variants.

Each component must be visually compared against the official Figma component before approval.

Fix one component at a time.

## Figma MCP Policy

The official Platforms Code Figma file is the source of truth.

Claude may ONLY use the following read-only MCP tools:

- search_design_system
- get_metadata
- get_design_context
- get_screenshot
- get_variable_defs
- download_assets (read-only asset export, e.g. icon SVGs — used by the icon import pipeline, `docs/ICON_LIBRARY.md`)

Claude MUST NOT use:

- use_figma
- create_new_file
- generate_figma_design
- upload_assets
- send_code_connect_mappings
- add_code_connect_map

The Figma file must never be modified automatically.


# Official Figma Node Resolution Policy

The Design System registry is the single source of truth.

Before using any Figma MCP tool:

1. Read:

frontend/src/design-system/registry/figma-component-map.json

2. If the component contains:

- figmaFile
- nodeId
- figmaUrl

then these values MUST be used directly.

Do NOT attempt:

- search_design_system
- component discovery
- node discovery

for already-resolved components.

Use the stored node immediately with:

- get_metadata
- get_design_context
- get_variable_defs
- get_screenshot

Only use search_design_system if:

- nodeId is null
- figmaFile is unknown
- component is not yet registered

If a resolved node exists, asking the user for a URL or attempting node discovery is considered an implementation error.

Implementation Rule

Every implementation session is limited to ONE component.

A component is considered complete only after:

- Live Figma MCP verification
- Visual Compliance completed
- Storybook completed
- Tests passing
- Validation passing
- Registry updated
- Documentation updated
- Commit created

Only after all of the above is completed may the next component begin.

Multi-component implementation is not allowed.
## Figma Access Security Policy

The agent must never:

- ask the user to open, select, or navigate any item in Figma Desktop
- depend on the currently open Figma page or desktop state
- inspect or control the user's local computer
- use local-desktop discovery as a node-resolution method
- use any Figma write, edit, generate, sync, or upload tool

Official component nodes are supplied manually by the user and stored in:

frontend/src/design-system/registry/figma-component-map.json

Before processing any component:

1. Read its registry entry.
2. Use the stored:
   - figmaFile
   - nodeId
   - figmaUrl
   - componentKey
3. If nodeResolutionStatus is "resolved", use the stored node directly with approved read-only MCP tools.
4. Do not run node discovery or ask for another URL.
5. If nodeId is missing, stop and report:
   "Manual node registration required."
6. Do not implement or approve a component until its nodeId is manually registered.

Allowed read-only tools:

- get_metadata
- get_design_context
- get_variable_defs
- get_screenshot
- download_assets only for approved read-only asset export

search_design_system may be used only for supplementary planning metadata. It must not replace a manually registered live node for implementation or approval.

Never determine whether a component is blocked from memory.

Always re-read the latest
figma-component-map.json
before making any implementation decision.

The registry is always the single source of truth.
## Design System Compliance

The Design System is the single source of truth for all UI implementation.

Always reuse the existing Design System before creating or modifying UI.

When implementing or refining any page:

- Never invent new spacing, typography, sizing, colors, border radius, shadows, or layout values.
- Always use the approved Design System tokens and scales.
- Never hardcode visual values unless they already exist in the Design System.
- Reuse existing Design System components whenever possible.
- If a required variation does not exist, extend the Design System instead of creating page-specific implementations.
- Maintain consistent spacing rhythm, typography hierarchy, and component sizing across the entire application.
- Keep application-specific logic separate from the Design System.

When implementing a page from a Figma or reference design:

- Match the visual result as closely as possible **without violating the Design System**.
- If the reference conflicts with the Design System, prefer the Design System implementation.
- Do not introduce custom CSS values simply to match the reference.
- If the Design System is missing something required, document it and extend the Design System properly instead of creating local workarounds.

Before considering any UI task complete, verify:

- Design System compliance
- RTL support
- Responsive behaviour
- Accessibility
- Visual consistency with the rest of the application
- No duplicated styling or page-specific hacks
## Root Cause First

Always fix the root cause.

Do not solve UI issues using temporary CSS overrides, negative margins, excessive padding, absolute positioning, !important, or page-specific workarounds.

When a layout issue is discovered:

1. Inspect the shared layout.
2. Inspect the reusable component.
3. Inspect the Design System.
4. Identify the root cause.
5. Apply the fix at the appropriate architectural level.

Only use page-specific styling when the page genuinely has unique requirements.
## Visual Verification

When a reference design or screenshot is provided:

- Compare the implementation against the reference before finishing.
- Verify spacing, alignment, proportions, typography, icon sizing, and responsive behaviour.
- Do not stop once the feature "works"; ensure it also matches the intended visual quality.

## Creative Composition Rule (Global)

The Design System is the single source of truth for implementation.

All pages must use only approved Design System components, tokens, typography, spacing, colors, accessibility patterns, and interaction behaviors.

However, compliance with the Design System does **not** mean pages should look plain or purely functional.

### Be Creative Through Composition

Create visually engaging, premium-quality experiences by using creative composition rather than creating new UI components.

Creativity is encouraged through:

- Layout composition
- Visual hierarchy
- Section rhythm
- Alternating content layouts
- Rich card arrangements
- Whitespace
- Background patterns
- Repository illustrations and graphics
- Icons
- Statistics
- Feature highlights
- Trust indicators
- Visual storytelling
- Marketing-oriented presentation
- Balanced imagery and content

### Repository Assets

Before introducing placeholders or new graphics, inspect and reuse existing repository assets.

Examples include:

- `src/assets/icons`
- Background patterns
- SVG illustrations
- Brand graphics
- Product icons
- Decorative assets

Repository assets should always be preferred over creating new ones.

### Background Patterns

When official branded background patterns exist in the repository, prefer using them as decorative page backgrounds (Hero sections, CTA banners, feature sections, etc.) rather than using flat color backgrounds.

Background patterns should:

- Respect Design System spacing
- Preserve readability
- Be responsive
- Be subtle
- Support—not overpower—the content

### Section Imagery & Placeholders

Sections should not be walls of text or bare data. Where an image, illustration, or visual would make a section **clearer and more modern**, add one. When a real asset does not exist yet, add a **visible placeholder** in its place (do not leave the section flat and wait for art).

- **Prefer real repository assets first** (`src/assets/…`: photos, illustrations, brand graphics, the background pattern). Reuse before inventing.
- **When none fits, build a placeholder** that still looks intentional and premium: a token-styled media panel (e.g. the brand pattern or a token tint) with a representative Design-System `Icon` and a short caption, and/or a real `<img>` wired to a repository asset. It must read as "image goes here," never as broken/empty.
- **Wire a swap seam**: model the image as data (e.g. an `imageUrl`/`avatarUrl` field, `null` → placeholder) so a real asset drops in later with no layout change. Note the placeholder in the hand-off so the owner can supply real art.
- Good placeholder spots: page/section hero banners, profile photos and avatars, card thumbnails, empty states, feature highlights, and step/section lead-ins.
- Placeholders are still bound by every rule here: tokens only, responsive, accessible (decorative images `aria-hidden` / empty `alt`; meaningful images get real `alt`), RTL-safe, and never a recreation of a real branding asset.
- **Always suggest** to the user, in the hand-off, where real pictures could go and which placeholders were added — so they can replace them.

### Marketing Quality

Public-facing pages should resemble modern premium digital products, not internal enterprise dashboards.

Each page should have:

- A clear visual focal point
- Strong visual hierarchy
- Intentional whitespace
- Engaging layouts
- Supporting imagery or illustrations where appropriate
- Premium section composition

Avoid pages that feel like stacked cards or long forms with little visual interest.

### What is Allowed

✅ Creative layouts

✅ Different section compositions

✅ Background patterns

✅ Existing repository graphics

✅ Existing repository illustrations

✅ Existing icons

✅ Marketing-style presentation

✅ Rich visual hierarchy

### What is NOT Allowed

❌ Creating new Design System components

❌ Overriding Design System tokens

❌ Introducing new colors

❌ Changing typography rules

❌ Breaking accessibility

❌ Ignoring responsive behavior

❌ Recreating branding assets that already exist

### Final Validation

Before considering any page complete, verify:

- It is 100% Design System compliant.
- Existing repository assets have been reused where appropriate.
- The page has a premium visual presentation.
- The page does not resemble a basic enterprise CRUD interface.
- The composition feels intentional, polished, and engaging.
- Creativity has been achieved through composition—not through violating the Design System.

## Deployment & scope

Deployment topology:

```
Browser → Server Nginx → Expert Hub containers (frontend 8085, API 8086) → SQL Server
```

Key assets: `deploy/` (the Dockerfiles, `nginx.conf`, `docker-compose.yml`,
`server-nginx.example.conf`, `config.js.template`, `docker-entrypoint.sh`,
`env/`, `scripts/`). The full guide is `docs/operations/DEPLOYMENT.md`.

- **Every frontend change runs** `npm run validate` and `npm run build`, from
  `frontend/`.
- **Every backend change runs** `dotnet build` and `dotnet test`, from
  `backend/`. Warnings are errors there, so a build that succeeds is a build with
  no warnings.
- **A design-system change** (`frontend/src/design-system/`) is its own task,
  with regression validation across every screen that uses the component.
- **Base path**: centralized in `EXPERT_HUB_BASE_PATH`
  (`VITE_EXPERT_HUB_BASE_PATH`, default `/expert-hub`, `''` for root) and
  mirrored by Vite's `base`. Never hardcode `/expert-hub` elsewhere.
- **Runtime config** (`apiBaseUrl`, environment, SSO and telemetry) comes from
  the container's `config.js` (`window.__EXPERT_HUB_RUNTIME_CONFIG__`), so one
  image serves every environment. It is visible in the browser: never secrets,
  credentials, or FAST/MTM/ERP/SQL values.
- **The backend is the only place a secret may live**, and only from the
  environment: `deploy/env/api.secrets.env` on the server (`ConnectionStrings__ExpertHub`,
  `Oidc__ClientSecret`, `Fast__ClientSecret`, `Ai__ApiKey`, …), never
  `appsettings.json`. A test fails the build if a value appears there.
- **Container and volume names are fixed** (`name: expert-hub` in the compose
  file). Renaming them on a running server orphans the database and
  data-protection volumes.
- **Deploy rebuilds only the Expert Hub containers.** Never run a server-wide
  `docker compose down` or `docker system prune`.
- **The target framework is a known debt**: `net9.0` in
  `backend/Directory.Build.props`, out of support since May 2026.

## graphify

This project has a knowledge graph at graphify-out/ (generated locally, ignored by git).

- For codebase questions, run `graphify query "<question>"` when
  graphify-out/graph.json exists, `graphify path "<A>" "<B>"` for relationships
  and `graphify explain "<concept>"` for a focused concept.
- After modifying code, run `graphify update .` to keep the graph current.
