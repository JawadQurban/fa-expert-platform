# State Management (FADS)

> How application state is categorized and handled across FADS and its consuming products. **Planning only — no code this phase** `[PROJ]`. Principle: **match the tool to the state category; do not over-engineer.**

---

## 1. State taxonomy

| Category | Examples | Recommended mechanism | Lives in |
|---|---|---|---|
| **Server/remote state** | Submissions list, request detail, FAQ content | Server-state library (cache/fetch) over the service layer | `apps/*/features` via hooks |
| **Form state** | Submit flow fields, validation, step index | React Hook Form (per pattern PAT-01) | `design-system/patterns` |
| **UI/ephemeral state** | Modal open, drawer open, toast queue, active tab | Local `useState` / component-local | component/provider |
| **Global app state** | Locale, direction, theme, auth session | React Context providers | `design-system/providers` |
| **URL state** | Filters, pagination, active view, route params | Router + query params | `apps/*/routes` |

**Default bias:** local state first → lift to context only when genuinely shared → introduce a library only for server-cache concerns. No global store unless justified.

## 2. Server/remote state
- Access **only** through the typed service layer (`REACT_ARCHITECTURE.md §7`).
- Recommend a server-state cache lib (**TanStack Query** candidate) for fetching, caching, loading/error, and revalidation — pairs with Loading (CMP-31) and Inline Alert (CMP-23) states.
- Until a backend exists (**Q2**), the same hooks resolve against the **mock adapter**; swapping to real API requires no component change.
- ⚠ **Q27:** confirm server-state library (TanStack Query vs plain fetch hooks) — decision gated by Q2.

## 3. Form state (PAT-01)
- One form controller per multi-step submission; step navigation state internal to the pattern.
- Field validation → catalog Validation messages (`CONTENT_MODEL §3`), consistent placement (`DESIGN_CONSTRAINTS.md DC-33`).
- Submit path: validate → confirm **Modal** (CMP-25) → service call → success **Toast** (CMP-22) → navigate (`USER_FLOW.md` F2).
- Draft persistence (local storage / server) ⚠**Q16**.

## 4. Global app state (providers)
| State | Provider | Persistence |
|---|---|---|
| Locale (ar/en) | `LocaleProvider` | localStorage + `lang`/`dir` sync (DC-10) |
| Direction (rtl/ltr) | `DirectionProvider` | derived from locale |
| Theme (DGA light + On-Color) | `ThemeProvider` | single theme (Q22) |
| Auth/session | `AuthProvider` (if auth) | ⚠Q4 |
| Toasts | `ToastProvider` | in-memory queue |

Keep providers minimal and composable; avoid a monolithic context.

## 5. URL as state `[S3: E17]`
- Filters (status/category/date), pagination, and active view live in **query params** so views are shareable, back-button-friendly, and predictable (DC-32).
- Powers PAT-02 (Entity list + filter) for Manage Requests and any future listing product.

## 6. UI/ephemeral state
- Local `useState`/`useReducer` inside components.
- Focus/dialog state coordinated by a11y hooks (`useFocusTrap`) — never leaks globally.
- Motion/animation state must not gate visibility of key elements (DC-14 / `[S3: E10]`).

## 7. Async & error handling `[S3: E16]`
- Every async operation exposes **idle / loading / success / error** to the UI.
- Loading → CMP-31; transient success → Toast (CMP-22); persistent error → Inline Alert (CMP-23); high-priority → Banner (CMP-24).
- Error copy from the catalog (problem + how to fix); consistent style/placement (DC-26/DC-33).
- Status announced via `aria-live` (WCAG 4.1.3, `COMPONENT_INVENTORY §3`).

## 8. Persistence
- Locale/theme prefs → localStorage.
- Draft submissions → ⚠Q16 (local vs server).
- No sensitive data in web storage; respects privacy notices (DC-35 / `[S3: E14]`).

## 9. Anti-patterns to avoid
- ❌ Global store for local UI state.
- ❌ Fetching in components (bypassing the service layer).
- ❌ Prop-drilling shared app state instead of a provider.
- ❌ Duplicating server state into local state (stale copies).
- ❌ Storing derived data (compute from source).

## 10. Definition of Done (state)
- [ ] Each state placed in the correct category (§1)
- [ ] Server state via service layer + cache hooks
- [ ] Async exposes loading/error with mapped components
- [ ] Filters/pagination in URL (shareable)
- [ ] Providers minimal; no unjustified global store
- [ ] localStorage limited to prefs (no sensitive data)

## 11. Open items
Q2 (backend), Q4 (auth/session), Q16 (drafts), Q22 (theme), Q27 (server-state lib). See `QUESTIONS.md`.
