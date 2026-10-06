# Microinteractions — Financial Academy Innovation Hackathon

> Feedback detail and motion for individual interactions. DGA requires **immediate, clear visual feedback** with **consistent style/timing**, and **motion must never hide key elements** `[S3: E9, E10]`. Motion uses FADS motion tokens (`sys.motion.duration.*`, `sys.motion.easing.*`).
>
> ⚠ **DGA motion tokens (durations/easings) are not machine-verifiable from `[S1]` (Q3).** The timing ranges below are **FADS engineering defaults** to reconcile with official DGA motion values when available. They are proposals, not claimed DGA requirements.

---

## 1. Motion principles
- **Purposeful, not decorative** — motion communicates state/continuity, never distracts.
- **Fast & subtle** — government-appropriate restraint.
- **Never hides content** — no key element (CTA, content) revealed only via animation; all remain reachable without motion (DC-14 / `[S3: E10]`).
- **Consistent** — same interaction → same motion everywhere (DC-26).
- **Respects `prefers-reduced-motion`** — see §9.
- **No motion-only feedback** — motion always accompanies a token/text/aria change, so reduced-motion users lose nothing.

## 2. Timing scale (proposed defaults ⚠Q3)
| Token (name) | Default | Use |
|---|---|---|
| `sys.motion.duration.instant` | ~75ms | tiny state flips (checkbox tick) |
| `sys.motion.duration.fast` | ~150ms | hover/focus/press feedback |
| `sys.motion.duration.base` | ~200–250ms | accordion, dropdown, toast in/out |
| `sys.motion.duration.slow` | ~300–350ms | drawer, modal, page/section transitions |
| `sys.motion.easing.standard` | ease-in-out | most transitions |
| `sys.motion.easing.entrance` | ease-out (decelerate) | elements entering |
| `sys.motion.easing.exit` | ease-in (accelerate) | elements leaving |
Keep interaction feedback ≤ fast to protect INP (`PERFORMANCE_STRATEGY.md §1`).

## 3. Hover microinteractions
| Element | Feedback |
|---|---|
| Button | background/elevation token shift over `fast`; cursor pointer |
| Link | underline/color token change over `fast` |
| Card (actionable) | subtle elevation/border token; **no size/layout shift** (CLS-safe) |
| Table row | background tint over `fast` |
| Nav item | color/underline; Selected persists |
| Rating star | fill preview up to hovered value |
Constraints: hover feedback never the sole interactivity signal (pair with focus); no reflow on hover.

## 4. Focus microinteractions
- Focus ring appears **instantly** (no delayed animation) — clarity for keyboard users (WCAG 2.4.7).
- Ring uses `sys.color.border.focus`, ≥3:1 (1.4.11), offset so it's visible on any background (incl. On-Color).
- Focus ring is **not** animated in a way that could be missed; may fade in ≤ `instant` only.
- Roving focus (tabs/radio/rating) moves selection indicator smoothly ≤ `fast`.

## 5. Loading & progress
| Pattern | Behavior |
|---|---|
| Button submit | inline spinner + disabled; label → "جارٍ الإرسال…" or persists; `aria-busy` |
| Region load | **skeleton** placeholders (preferred) matching final layout to avoid CLS; or Loading (CMP-31) |
| File upload | determinate progress bar per file (Uploading→Completed/Failed); percentage announced politely |
| Step form | step transition slide/fade ≤ `base`; new step content announced |
| Page/route | top-of-content loading indicator or skeleton; focus to heading when ready |
Skeletons should not shimmer aggressively; a calm pulse ≤ `slow` loop. Announce completion via `aria-live` (4.1.3).

## 6. Success microinteractions `[S3: E13]`
- Success **Toast** slides/fades in over `base` from top (logical), auto-dismiss after a readable delay (default ~5s, pausable on hover/focus), plus manual close; `aria-live="polite"`.
- Inline success (e.g., valid field) = checkmark + color token appears instantly; no bounce.
- Submission success also drives navigation (`INTERACTION_SPECIFICATION.md §8`).
- Restraint: no confetti/celebratory excess — government tone (`VISUAL_HIERARCHY.md §8`).

## 7. Failure microinteractions `[S3: E16]`
- Inline error appears below field over `fast`; field border → error token; icon + message.
- **No shake/jarring motion**; error is calm and clear (reduced-motion-safe).
- Error region uses `role="alert"`; focus moves to first error on submit.
- Toast/Inline Alert for system errors slides in over `base`; persists until resolved (Inline) or dismissed.

## 8. Component-specific motion
| Component | Motion |
|---|---|
| Accordion (CMP-08) | height/opacity expand-collapse over `base`, `standard` easing; chevron rotates; content not clipped mid-focus |
| Dropdown/Menu (CMP-11/15) | fade/scale-in from trigger over `base`; `Esc`/blur closes over `fast` |
| Modal (CMP-25) | scrim fades + dialog scales/fades in over `slow`; focus trap on enter; reverse on exit |
| Drawer (CMP-02) | slides from logical start over `slow`; scrim fade |
| Tabs (CMP-09) | active-indicator slides to selected tab over `base` (RTL-aware direction) |
| Toast (CMP-22) | enter `base` entrance easing; exit `fast` exit easing |
| Tooltip (CMP-30) | fade in over `fast` after small hover/focus delay; instant on focus |
| Switch/Checkbox | thumb/tick over `fast`/`instant` |

## 9. Reduced motion (`prefers-reduced-motion: reduce`)
- Replace slides/scales/expands with **instant** or a minimal opacity fade.
- Anchor smooth-scroll → instant jump.
- Skeleton pulse → static placeholder.
- Auto-advancing/looping motion disabled.
- **No information is lost** — all state changes still occur via tokens/text/aria; motion is purely the delivery, so reduced-motion users get identical outcomes.
- Implement as a global media-query gate at the motion-token layer so every component inherits it.

## 10. Performance guardrails
- Animate only compositor-friendly properties (opacity/transform); avoid animating layout properties (width/height where it causes reflow) except controlled accordion height.
- Keep interaction feedback within INP budget (≤200ms) (`PERFORMANCE_STRATEGY.md`).
- No long-running JS during interactions.

## 11. Consistency checklist
- [ ] Same interaction → same timing/easing app-wide
- [ ] All motion has a non-motion equivalent (aria/text/token)
- [ ] `prefers-reduced-motion` honored globally
- [ ] No key element hidden behind motion (DC-14)
- [ ] Feedback ≤ fast for direct interactions
- [ ] No CLS from hover/loading

## 12. Open items
Q3 (official DGA motion tokens to replace proposed defaults). See `QUESTIONS.md`.
