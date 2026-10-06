# Visual Hierarchy — Financial Academy Innovation Hackathon

> How attention is directed. DGA requires a clear visual hierarchy that guides the user to important elements first `[S3: E1]`, with government-grade clarity and predictability. Uses FADS type/color/space tokens (`DESIGN_TOKENS.md`); exact values ⚠Q3.

---

## 1. Typography hierarchy

Two token families: **Display** (marketing/section impact) and **Text** (content/UI) `[S3: F6]`, single font **IBM Plex Sans Arabic** `[S3: F5]`.

| Role | Token (name) | Usage | Notes |
|---|---|---|---|
| Page title (H1) | `sys.typography.display.xl`/`lg` | one per screen (hero name, page H1) | largest; unique per screen |
| Section title (H2) | `sys.typography.display.md`/`sm` | each major section | consistent across sections |
| Subsection (H3) | `sys.typography.text.lg` (bold weight) | card titles, sub-blocks | |
| Body | `sys.typography.text.md` | paragraphs, descriptions | primary reading size |
| Secondary/meta | `sys.typography.text.sm` | captions, meta, helper | muted text token |
| Micro | `sys.typography.text.xs` | legal, timestamps | sparingly |

Rules:
- **One H1 per screen**; never skip heading levels (H1→H2→H3) — visual size may vary but semantic order is strict (WCAG 1.3.1).
- Weight for emphasis, not just size; headings use approved heading weights `[S3: F6]`.
- **Reading measure** limited for Arabic long-form (`container.prose`, `LAYOUT_SPECIFICATION.md §3`).
- Responsive type: sizes step down per tier via responsive typography tokens `[S3: F7]`; hierarchy relationships preserved.
- Line-height/letter-spacing from tokens; Arabic legibility prioritized.

## 2. Section importance (landing)

Descending priority (drives size, position, whitespace):
1. **Hero** — highest; first viewport; primary CTA dominant.
2. **Evaluation Criteria + How to Participate** — decision-enabling; strong presence.
3. **About / Goals** — context; medium.
4. **Timeline** — supporting.
5. **FAQ / Feedback / Partners** — late; lower weight.
6. **Footer** — utility; lowest visual weight, high completeness.

Importance is expressed through: position (earlier = higher), size (heading scale), whitespace (more space = more importance), and color emphasis (primary vs neutral) — never through status colors (DC-05).

## 3. CTA hierarchy `[S3: E1]`

| Tier | Example | Treatment |
|---|---|---|
| **Primary** | «قدم ابتكارك» | primary button; highest contrast; one dominant primary per view |
| **Secondary** | «إدارة طلباتي» | secondary button; visible but subordinate |
| **Tertiary** | inline links, «عرض», «المزيد» | link styling |
| **Destructive** | «سحب الطلب» | requires confirmation; not visually loud; never accidental |

Rules:
- **One primary action per screen region** — competing primaries dilute hierarchy.
- Primary CTA persists (header + hero) and is never hidden behind motion (DC-14).
- Button prominence via token color/weight, not size inflation.
- On colored/image backgrounds, CTAs use **On-Color** tokens with verified contrast (DC-06).

## 4. Information priority (scan → act)

Per screen, order content by user need:
- **Submit screen:** current step + fields first; help/secondary info subordinate; single primary action visible.
- **Manage screen:** status is the highest-value column (scannable Tag); title second; actions at logical end.
- **Detail screen:** status + title header first; then content; then feedback; actions grouped.
- **Landing:** value proposition + primary CTA above the fold.

Techniques: proximity (group related), similarity (consistent cards), whitespace (separate groups), and a single accent (primary color) for the most important action.

## 5. Scanning behavior (RTL) 

- Arabic readers scan **right→left, top→bottom**; place primary content/CTA at the logical **start** (right) and lead each section with its heading.
- Support an **F/Z-pattern mirrored for RTL**: strong start-aligned headings, scannable left/end-aligned metadata.
- Card grids scan in reading order (right→left rows); keep equal heights for rhythm.
- Use consistent, predictable section rhythm so users learn the page (WCAG 3.2 predictability; `[S3: E6, E7]`).
- Limit choices per view (reduce cognitive load for personas A5, `USER_PERSONAS.md`).

## 6. Color as hierarchy signal (within DGA rules)
- **Primary color** = the single most important action/emphasis.
- **Neutral/gray** = default content, categories, structure.
- **Status colors** = status only (success/error/warning/information) — never for general emphasis (DC-05).
- Ensure emphasis also works without color (weight/size/position) for color-blind users (WCAG 1.4.1).

## 7. Whitespace & density
- Generous, government-appropriate spacing; consistent `sys.space.section-gap` rhythm.
- Whitespace communicates grouping and importance — denser = utility (footer, tables), airier = feature (hero, criteria).

## 8. Government UX principles (applied)
- **Clarity over decoration** — content and task first; minimal ornamentation `[S3]`.
- **Trust & consistency** — official look, predictable patterns, honest states (no dark patterns).
- **Inclusivity** — Arabic-first, WCAG 2.2 AA, works on low-end mobile `[S3: F14]`.
- **Efficiency** — minimal steps, clear CTAs, scannable information `[S3: E3]`.
- **Transparency** — visible privacy/security notices, clear consequences of actions `[S3: E14]`.
- **Accessibility of language** — clear, concise, audience-appropriate wording `[S3: E5]` (`COPYWRITING_GUIDELINES.md`).

## 9. Hierarchy verification checklist
- [ ] One H1/screen; no skipped levels
- [ ] One dominant primary CTA per region
- [ ] Status colors used only for status
- [ ] Emphasis survives grayscale (color-independent)
- [ ] Section order reflects priority + `[S3: T3]` info-first
- [ ] Reading measure limited for Arabic prose
- [ ] Consistent rhythm across screens

## 10. Open items
Q3 (type scale values), Q6 (section order), Q17 (timeline). See `QUESTIONS.md`.
