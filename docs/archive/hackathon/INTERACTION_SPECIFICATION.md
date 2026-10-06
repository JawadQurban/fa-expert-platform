# Interaction Specification — Financial Academy Innovation Hackathon

> Every interaction, input modality, and flow. RTL-default. DGA requires immediate/clear feedback, predictable behavior, consistent patterns, minimal steps, and consistent errors `[S3: E3, E6, E7, E9, E16]`. Visual/timing detail of feedback is in `MICROINTERACTIONS.md`; this doc defines **what happens and why**.

---

## 1. Interaction states (all interactive components)
Every component implements its full DGA state set `[S3]` (`COMPONENT_INVENTORY.md`). Baseline behaviors:

| State | Trigger | Behavior |
|---|---|---|
| Default | idle | resting appearance (tokened) |
| Hover | pointer over (pointer devices only) | affordance cue; never the *only* signal of interactivity |
| Focus | keyboard/programmatic focus | **always-visible focus indicator** (WCAG 2.4.7); ≥3:1 (1.4.11) |
| Pressed/Active | pointer down / key activation | pressed feedback |
| Selected | current choice/tab/nav | persistent; `aria-current`/`aria-selected` |
| Disabled | unavailable | non-focusable or `aria-disabled`; reason communicated where possible |
| Read-only | view-only field | focusable, not editable |
| Visited | link followed | link Visited state `[S3: C6]` |

Rule: **hover is an enhancement, not a requirement** — all hover affordances have focus/tap equivalents.

## 2. Hover (pointer) 
- Applies to: buttons, links, cards (actionable), nav items, table rows, tabs, accordion headers, rating.
- Behavior: subtle token-based emphasis (color/elevation per component); cursor `pointer` on actionable only.
- Constraints: no layout shift on hover (protect CLS); content revealed on hover must also be reachable by focus and be dismissable/persistent (WCAG 1.4.13); nothing important is hover-only (DC-14).

## 3. Focus & focus management
- **Visible focus** on every focusable element (DC-27).
- **Logical focus order** follows RTL DOM order (WCAG 2.4.3).
- **Skip link** first in tab order (2.4.1).
- **Route change:** move focus to the new page's H1/main; update document title.
- **Dialog/Drawer open:** trap focus inside; on close, **restore** focus to the trigger.
- **Focus not obscured:** sticky header must not cover the focused element (2.4.11) — scroll with offset.
- **Errors:** on submit failure, move focus to the first invalid field (or the error summary).

## 4. Keyboard interaction (per component)
| Component | Keys |
|---|---|
| Button/Link | `Enter`/`Space` (button), `Enter` (link) |
| Nav Header/Menu | `Tab` between, `Arrow` within menus, `Esc` closes submenu |
| Nav Drawer/Modal | `Esc` closes; focus trapped; `Tab` cycles |
| Tabs (CMP-09) | `Arrow` moves (RTL-aware), `Home/End`, `Enter/Space` activates |
| Accordion (CMP-08) | `Enter/Space` toggles header; `Tab` moves |
| Dropdown/Select (CMP-15) | `Enter/Space` opens, `Arrow` navigates, `Esc` closes, type-ahead |
| Radio (CMP-16) | `Arrow` selects within group (RTL-aware) |
| Checkbox/Switch (CMP-17/18) | `Space` toggles |
| Date Picker (CMP-19) | `Arrow` days (RTL-aware), `PageUp/Dn` months, `Esc` closes |
| Rating (CMP-29) | `Arrow` sets value, `Home/End` |
| Table (CMP-27) | `Tab` to interactive cells; arrow-cell nav optional |
| Steps (CMP-21) | nav via the step buttons; not free-jump unless allowed |

RTL note: Arrow-key direction is **logical** — `→`/`←` map to start/end correctly in RTL (DC-25).

## 5. Touch & gesture `[S3: E11, F14]`
- Targets ≥44×44px; adequate spacing (2.5.8).
- Support tap, scroll, swipe (drawer open/close), long-press where natural — but **every gesture has a discrete alternative** (e.g., File Uploader drag also offers a browse button + keyboard, WCAG 2.5.7).
- No hover-dependent flows on touch; tooltips openable on tap/focus.
- Momentum scrolling within scroll containers (tables) not the page body.

## 6. Transitions & navigation
- **Route navigation:** SPA transitions; show loading if data-bound; preserve scroll appropriately; update breadcrumb + title.
- **Anchor scroll (landing):** smooth-scroll to section, then focus the section heading; respect `prefers-reduced-motion` (instant jump).
- **Back/forward:** URL holds filters/pagination/query so browser history restores state (`STATE_MANAGEMENT.md §5`).
- **Language toggle (F6):** switches locale + `dir` + all content atomically; keeps user on the same route/scroll; announces change; no content loss (`[S3: F16]`).
- Transition motion detail/timing → `MICROINTERACTIONS.md`.

## 7. Form behavior & validation `[S3: E16]`
- **Labels:** every field labelled; required marked in text ("مطلوب") + `aria-required`.
- **Helper text:** persistent guidance via `aria-describedby`.
- **Validation timing:** validate on **blur** (per field) and on **Next/Submit** (all fields in scope). Do not validate on every keystroke (except soft affordances like character count).
- **Error display:** message directly below the field, consistent style/placement across all fields (DC-33); field marked `aria-invalid`; message linked via `aria-describedby`; icon + text (not color-only, 1.4.1).
- **Error summary (optional):** on submit with multiple errors, an error summary Inline Alert at form top listing links to fields.
- **Success clearing:** error clears once the field becomes valid.
- **Message content:** states the problem + how to fix (`COPYWRITING_GUIDELINES.md`).
- **Redundant entry:** don't re-ask data already provided across steps (WCAG 3.3.7).

## 8. Submission flow (SCR-02 / PAT-01) — canonical sequence
```
Enter /submit  [auth gate? ⚠Q4]
Step 1 بيانات → validate(blur+next) → Step 2 المعايير → Step 3 المستندات → Step 4 المراجعة
   • back/next preserve entered data; step change announced; focus → step heading
   • upload: select/drag → Uploading(progress) → Completed | Failed(error, retry/remove)
Step 4: read-only summary + consent checkbox (required)
   • «إرسال» → Confirmation Modal (CMP-25): "هل أنت متأكد من إرسال ابتكارك؟" [تأكيد / إلغاء]
   • Confirm → submitting (button loading, form disabled)
        success → success Toast (CMP-22) "تم إرسال ابتكارك بنجاح" → redirect /requests
        failure → Inline Alert (CMP-23) + retry; data preserved; focus → alert
Cancel Modal → returns to Step 4 unchanged
Leave with unsaved data → prompt (⚠Q16 draft-save)
```

## 9. Request-management flow (SCR-03/04 / PAT-02)
```
/requests → load (skeleton) → table/cards
   filter(status/category/date) → URL updates → refetch → results | empty | error
   paginate → URL page param
   «عرض» → /requests/:id (skeleton → detail)
Detail actions:
   «سحب» (⚠Q13) → Confirm Modal → confirm → submitting → success Toast → status→"مسحوب"
   «تعديل» (⚠Q13) → /submit prefilled
   unknown id → 404 (SCR-07)
```

## 10. Confirmation dialogs (Modal CMP-25) `[S3: C9]`
- Used for: submit confirm, withdraw confirm, destructive/irreversible actions.
- **Never** for large data entry (DC-13) — those are form pages.
- Structure: title, concise body, primary action (logical end) + cancel (logical start).
- Behavior: focus trap, `Esc` = cancel, scrim click = cancel (for non-destructive) / require explicit choice (destructive), focus restore on close, `aria-modal` + labelled.

## 11. Notifications `[S3: C8]`
| Type | Component | When | Behavior |
|---|---|---|---|
| Toast | CMP-22 | transient success/info (submit success, feedback received) | auto-dismiss (timed) + manual close; `aria-live="polite"`; stack via ToastProvider; pause on hover/focus |
| Inline Alert | CMP-23 | persistent contextual errors/notices (form/page) | stays until resolved; `role="alert"`/`status`; closeable if interactive |
| Notification banner | CMP-24 | high-priority permanent, top of page | page-level; `role="alert"` for critical |
- Success/error semantics use status colors **only** for status (DC-05); always paired with text/icon.
- Consistent style & timing across the app (`[S3: E9]`).

## 12. Loading & async feedback
- Every async action exposes idle/loading/success/error (`STATE_MANAGEMENT.md §7`).
- Button-level: disable + inline spinner during submit (label persists or "جارٍ الإرسال…").
- Region-level: skeleton/Loading (CMP-31) for lists/details.
- Announce completion via `aria-live` (4.1.3).
- Optimistic UI only where safe (e.g., filter chips), never for irreversible submits.

## 13. Consistency guarantees (cross-app)
- Same action = same interaction everywhere (DC-26): submit, confirm, error, toast patterns are identical across screens.
- Predictable: no surprising navigation; external links flagged (DC-28) and open per DGA/link convention.
- Reduced motion respected globally (`MICROINTERACTIONS.md`).

## 14. Open items
Q4 (auth gating), Q13 (edit/withdraw), Q16 (draft-save), Q10 (search interactions), plus timing/motion in `MICROINTERACTIONS.md`. See `QUESTIONS.md`.
