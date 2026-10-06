# Component Mapping — UI Regions → DGA Components

> Maps every UI region (from `WIREFRAME.md`) to a specific **DGA Platforms Code** component, its **required states** `[S3]`, and the pages where it appears. This enforces **reusable components, no page-specific one-offs** `[PROJ: G2]`.
>
> **Rule:** Use each component **as defined in Platforms Code** (shape, radius, color, spacing) with **no base customization** `[S3]`. State sets are copied from `DGA_MASTER_SPECIFICATION.md §4`.

---

## 1. Component inventory (reusable library)

| ID | DGA Component | Required states (must all be built) `[S3]` | Used on pages | Priority |
|---|---|---|---|---|
| CMP-01 | Navigation Header | Default, Hovered, Pressed, Focused, Disabled, Selected; external-link icon | All | Primary |
| CMP-02 | Nav Drawer | (mobile nav) open/closed | All (mobile) | Secondary |
| CMP-03 | Footer | grouped links; logos/contact/privacy | All | Primary |
| CMP-04 | Breadcrumbs | Default, Hovered, Pressed, Focused, Disabled; current=Disabled | Sub-pages | Primary |
| CMP-05 | Button | Default, Hovered, Pressed, Selected, Focused, Disabled | All | Primary |
| CMP-06 | Link | Default, Hovered, Pressed, Focused, Visited, Disabled; external icon | All | Primary |
| CMP-07 | Card | Default, Hover, Focused, Disabled; variants; CTA on actionable | Landing, Requests | Primary |
| CMP-08 | Accordion | Default, Hovered, Pressed, Focused, Disabled; Expanded/Collapsed | FAQ, Criteria detail | Primary |
| CMP-09 | Tabs | Selected/Unselected | Manage (states), landing sub-nav | Primary |
| CMP-10 | Content Switcher | Normal, Hovered, Focused | Requests view toggle | Primary |
| CMP-11 | Menu | Selected | Header/user menu | Primary |
| CMP-12 | Avatar | initials / image / icon | Header (if auth) | Primary |
| CMP-13 | Text Input | Default, Hovered, Pressed, Focused, Read-only, Disabled | Submit form | Primary |
| CMP-14 | Textarea | Default, Hovered, Pressed, Focused, Read-only, Disabled; placeholder/helper/error | Submit form | Primary |
| CMP-15 | Dropdown | Default, Hovered, Pressed, Focused, Read-only, Disabled | Form, filters | Primary |
| CMP-16 | Radio | Default, Hovered, Focused, Read-only, Disabled; Selected/Unselected | Form | Primary |
| CMP-17 | Checkbox | Checked/Unchecked/Indeterminate | Consent, filters | Primary |
| CMP-18 | Switch | Default, Hovered, Focused, Disabled; On/Off | Preferences | Primary |
| CMP-19 | Date Picker | Default, Hovered, Pressed, Focused, Disabled; Selected/Today/Next/Prev | Dated fields (⚠Q) | Primary (cond.) |
| CMP-20 | File Uploader | Default, Drag+Hover, Disabled; Uploaded/Not Uploaded; status; errors | Submit Step 3 | Primary |
| CMP-21 | Steps | (step progression) | Submit flow | Secondary |
| CMP-22 | Notification (Toast) | temporary | Submit success, transient | Primary |
| CMP-23 | Inline Alert | permanent | Form errors, page notices | Primary |
| CMP-24 | Notification (banner) | high-priority permanent, top of page | Global banners | Primary |
| CMP-25 | Modal | confirmation/feedback/alerts (not bulk entry) | Submit/withdraw confirm | Primary |
| CMP-26 | Tag | status vs neutral/primary | Categories, statuses | Primary |
| CMP-27 | Table | per spec | Manage Requests | Primary |
| CMP-28 | Pagination | per spec | Requests, ideas list | Secondary |
| CMP-29 | Rating | Normal, Pressed; Selected, Half | Feedback | Primary |
| CMP-30 | Tooltip | placement + alignment | Field hints, icons | Primary |
| CMP-31 | Loading | per spec | Async states | Secondary |
| CMP-32 | Digital Stamp | top of page; cert link; ≤2 secondary els | ⚠Q5 (cond.) | Primary (cond.) |
| CMP-33 | Search | search bar + results | ⚠Q10 (cond.) | Primary (cond.) |

## 2. Region → component map (from `WIREFRAME.md`)

| Wireframe region | Component(s) | Notes / states to verify |
|---|---|---|
| W1 top bar | CMP-01, CMP-06, CMP-11, CMP-12, CMP-05 (CTA), CMP-33 | Selected marks current section |
| W1 hero CTAs | CMP-05 (primary + secondary) | On-Color if on colored/image hero `[S3: F4]` |
| W1 goals | CMP-07 or list | Informational card → CTA optional |
| W1 criteria (6) | CMP-07 (×6) | Informational cards; grid reflow |
| W1 how-to | CMP-21 | Steps overview |
| W1 FAQ | CMP-08 | Expanded/Collapsed |
| W1 feedback | CMP-29 + CMP-14 + CMP-05 | Confirmation after submit `[S3: E13]` |
| W1 footer | CMP-03, CMP-06 | Mandatory footer content |
| W1-m nav | CMP-02 | Mobile drawer |
| W2 breadcrumb | CMP-04 | Current page disabled |
| W2 steps | CMP-21 | 4 steps |
| W2 fields | CMP-13, CMP-14, CMP-15, CMP-16, CMP-17 | Inline errors `[S3: E16]` |
| W2 upload | CMP-20 | Name/status/remove + errors |
| W2 review | CMP-07 (details card), CMP-17, CMP-05 | Service Details Card term `[S3: T6]` |
| W2 submit | CMP-25 → CMP-22 | Modal confirm → success toast |
| W3 filters | CMP-15, CMP-26 | Status/category/date `[S3: E17]` |
| W3 table | CMP-27, CMP-26, CMP-06 | Status Tags |
| W3 paging | CMP-28 | |
| W3b detail | CMP-07, CMP-26, CMP-05, CMP-25 | Withdraw → Modal ⚠Q13 |
| W6 search | CMP-33, CMP-15, CMP-28 | Bar on results `[S3: T10]` |
| W7 error | Featured icon, CMP-05 | Icon >24px = Featured `[S3: F10]` |

## 3. Icon usage rules (applies wherever icons appear) `[S3]`
- Icons **only** from the official DGA library; no size/color change `[S3: F9]`.
- **>24px → Featured icon** variant `[S3: F10]`.
- **Status icons** = status colors (attention only); **general/classification icons** = neutral/primary (gray/green) `[S3: F11]`.
- External-link icon (Link Square) on all external links/tabs `[S3: C4, C20]`.

## 4. Tag/color rules `[S3: F3, F11]`
- **Status tags** (مُرسل/مقبول/مرفوض/تحذير) use approved status colors.
- **Category tags** (تصنيف الابتكار) use neutral/primary colors — status colors forbidden for non-status use.

## 5. Build-order recommendation (feeds `IMPLEMENTATION_PLAN.md`)
1. Foundations (tokens, RTL, font) → 2. Shell (Header, Footer, Nav Drawer, Breadcrumbs) → 3. Primitives (Button, Link, Input, Textarea, Dropdown, Checkbox, Radio, Tag) → 4. Composite (Card, Accordion, Tabs, Table, Steps, File Uploader, Modal, Notifications, Rating) → 5. Pages.

## 6. Anti-pattern guardrails (compliance risks) `[S3]`
- ❌ No custom-styled buttons/inputs — use DGA base only.
- ❌ No Modal for large data entry — use form template `[S3: C9]`.
- ❌ No status colors for decorative/category use `[S3: F11]`.
- ❌ No custom spacing — global tokens only `[S3: F8]`.
- ❌ No resized/recolored icons `[S3: F9]`.
