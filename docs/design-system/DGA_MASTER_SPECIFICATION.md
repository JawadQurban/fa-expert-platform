# DGA Master Specification — Platforms Code v1.0 (Project Baseline)

> Consolidated, **verifiable** DGA requirements for this project, extracted from the official compliance checklist `references/DGA_Standards.xlsx` `[S3]` and the guideline URLs it references on `[S1] https://design.dga.gov.sa/`.
>
> **Verification key:** ✅ = explicitly stated in an official source. ⚠ = category confirmed but exact value **not machine-verifiable** → tracked in `QUESTIONS.md`. This document contains **no invented values.**
>
> Source legend is defined in `PROJECT_SCOPE.md §1`.

---

## 1. The Four Compliance Pillars `[S3]`

The official checklist organises requirements into four pillars plus two priority tiers:

| Pillar (Arabic) | Pillar (English) | Meaning |
|---|---|---|
| أساسات | **Foundations** | Color, typography, spacing, icons, responsive, RTL |
| قوالب | **Templates** | Home, service, e-participation, search page layouts |
| عناصر | **Components/Elements** | The component library + their states |
| التجربة | **Experience** | UX principles, content, accessibility, consistency |

**Priority tiers:** المعايير الأساسية = **Primary/Essential** criteria; المعايير الثانوية = **Secondary** criteria. Both are captured in `COMPLIANCE_MATRIX.md`.

---

## 2. Foundations (أساسات)

### 2.1 Design system version ✅
Implement **Platforms Code v1.0** correctly `[S3 →` https://design.dga.gov.sa/ `]`.

### 2.2 Color system
- ✅ Use **only approved colors / Color Design Tokens** (background, text, etc.) **without modification or replacement** `[S3 →` https://design.dga.gov.sa/guidelines/foundations/color-system `]`.
- ✅ **Status colors** exist and are reserved: **success, error, warning, information** — used **exclusively** for attention states (success/error/warning/processing). For general use & content classification, use **neutral or primary colors (e.g., gray or green)**; status colors must **not** be used for non-status purposes `[S3]`.
- ✅ **"On Color" property:** any element placed on a colored background must use the component's **On Color** variant to meet contrast/clarity `[S3]`.
- ✅ Contrast must be verified (checklist references WebAIM contrast checker) `[S3]`.
- ⚠ Exact hex values (primary green, neutrals, each status color) — **not verifiable** from `[S1]` (SPA). → **Q3**.

### 2.3 Typography
- ✅ Approved font: **IBM Plex Sans Arabic** `[S3 →` https://design.dga.gov.sa/guidelines/foundations/typography `]`.
- ✅ Apply **Typography Design Tokens** with two families of variants: **Display variants** and **Text variants** `[S3]`.
- ✅ Appropriate **font weights for headings** and **responsive typography** `[S3]`.
- ⚠ Exact per-variant sizes, weights, line-heights → **Q3**.

### 2.4 Layout & spacing
- ✅ Use **Global Spacing Design Tokens** only; do **not** use element-custom spacing `[S3 →` https://design.dga.gov.sa/guidelines/foundations/layout-and-spacing `]`.
- ✅ Spacing unit steps are multiples such as **4px, 8px, 16px …** `[S3]`.
- ⚠ Full spacing scale + grid columns/margins/gutters exact values → **Q3**.

### 2.5 Iconography
- ✅ Use **only** icons from the **official icon library** — no change to size or color `[S3 →` https://design.dga.gov.sa/guidelines/foundations/iconography `]`.
- ✅ For icons **larger than 24px**, use the **Featured icon** variant (do not resize/recolor variants) `[S3]`.
- ✅ Icon usage has two modes: **(a) Status icons** — approved status colors, attention only; **(b) General/classification** — neutral or primary colors (gray/green); status colors forbidden for non-status use `[S3]`.
- ✅ If no suitable icon exists, design per icon guidelines **and submit for approval** via the DGA request link `[S3]`.

### 2.6 Responsive design
- ✅ Design adapts to different screen sizes/orientations; layout **auto-rearranges columns/components** across **Mobile, Tablet, Desktop** `[S3 →` https://design.dga.gov.sa/thoughts/responsive-design `]`.
- ✅ Fully usable on mobile: touch interactions, viewport size, navigation reachable on small screens `[S3]`.
- ⚠ Exact breakpoint pixel values → **Q3**.

### 2.7 Language & direction
- ✅ **Arabic-first** across all pages/components; high-quality wording `[S3]`.
- ✅ English supported **secondarily**; on language switch, **entire content** must update with no loss `[S3]`.
- ✅ (Implied by Arabic-first + `[PROJ]`) **RTL is the default layout.**

---

## 3. Templates (قوالب)

| Template | Key mandated rules `[S3]` | Guideline URL `[S1]` |
|---|---|---|
| **Home page** | Apply home template per platform; mandatory **hero** using one approved type (image / colored background / object); for **informational** platforms a **news/info** section is first after hero; for **service** platforms a **services** section is first after hero; reuse standardized sections (e.g., partners); new sections must use approved foundations. | `/guidelines/templates/home-page` |
| **Service page** | **Full adherence** to the template incl. exact terms/headings: **Steps, Requirements, Required Documents, Service Details Card**, etc., **without modification**. Includes **Rating section** and **Feedback section**. | `/guidelines/templates/service-page`, `/rating-section`, `/feedback-section` |
| **E-Participation page** | Follow the **8 main sections** exactly as in the template. If no subpages exist, section links may be used. | `/guidelines/templates/e-participation-page` |
| **Search page** | Use the search template from Figma; **search bar present on results page**; results relevant & fast; results organized by platform categories (news, services, articles…) with user filters (type, date). | `/guidelines/templates/search-page` |

- ⚠ The **names/order/content of the 8 e-Participation sections** and the exact home-page section list are **not machine-verifiable** from `[S1]`. → **Q6**.

---

## 4. Components (عناصر) — Library & Required States

Every component must be used **as defined in Platforms Code** — shape, border-radius, color, spacing — **without customizing the base design**, and must implement its **states** `[S3]`. Full state lists below are taken verbatim from `[S3]`.

### 4.1 Primary/Essential components
| Component | Required states / rules `[S3]` | Guideline URL `[S1]` |
|---|---|---|
| **Digital Stamp** | Placed at **top of page**; certificate number correctly linked to its page; up to **2** secondary elements (share/a11y) on the **left** of the stamp. | `/components/content-display/digital-stamp` |
| **Buttons** | Default, Hovered, Pressed, Selected, Focused, Disabled. | `/components/actions/buttons` |
| **Dropdown** | Default, Hovered, Pressed, Focused, Read-only, Disabled; only allowed change is adding Dropdown List Items. | `/components/actions/dropdown` |
| **Link** | Default, Hovered, Pressed, Focused, Visited, Disabled; **external link icon (Link Square)** required for external links. | `/components/actions/link` |
| **Accordion** | Default, Hovered, Pressed, Focused, Disabled; contextual Expanded/Collapsed. | `/components/content-display/accordion` |
| **Menu** | Contextual **Selected**. | `/components/navigational/menu` |
| **Content Switcher** | Normal, Hovered, Focused. | `/components/data-display/content-switcher` |
| **Notification** | Toast (temporary), **Inline Alert** (permanent), **Notification** (high-priority permanent, top of page); use in correct context; closeable when interactive. | `/components/feedback/notification` |
| **Modal** | For confirmation/feedback/important alerts only; **not** for large data entry (use form template). | `/components/feedback/modal` |
| **File Uploader** | Default, Drag+Hover, Disabled; Uploaded/Not Uploaded; show filename, status (Uploading/Completed/Failed), Remove; clear error messages (fail/size/type). | `/components/forms-and-inputs/file-uploader` |
| **Radio** | Default, Hovered, Focused, Read-only, Disabled; Selected/Unselected. | `/components/forms-and-inputs/radio` |
| **Checkbox** | Checked / Unchecked / Indeterminate. | `/components/forms-and-inputs/checkbox` |
| **Switch** | Default, Hovered, Focused, Disabled; On/Off. | `/components/forms-and-inputs/switch` |
| **Text Input** | Default, Hovered, Pressed, Focused, Read-only, Disabled. | `/components/forms-and-inputs/input` |
| **Textarea** | Default, Hovered, Pressed, Focused, Read-only, Disabled; placeholder + helper text; clear error handling. | `/components/forms-and-inputs/textarea` |
| **Date Picker** | Default, Hovered, Pressed, Focused, Disabled; Selected/Today/Next/Prev. | `/components/forms-and-inputs/datepicker` |
| **Tabs** | Selected/Unselected; clear labels, visual balance. | `/components/navigational/tabs` |
| **Tags** | Status vs neutral/primary usage (same rule as icons). | `/components/search-and-filters/tags` |
| **Card** | Default, Hover, Focused, Disabled; only 2 allowed adjustments (internal alignment or inner spacing); approved variants (content/image/shadow/no-shadow); actionable cards need a clear **CTA**, informational cards optional. | `/components/content-display/card` |
| **Navigation Header** | Tab/submenu states (Default, Hovered, Pressed, Focused, Disabled); Selected; external link icon on external tabs/submenus; responsive across all sizes. | `/components/ui-shell/navigation-header` |
| **Footer** | Mandatory: official links, org logos, contact info, privacy policies; links grouped under headings (e.g., "Important Links", "Support & Help"). | `/components/ui-shell/footer` |
| **Breadcrumbs** | Default, Hovered, Pressed, Focused, Disabled; **current page disabled/non-interactive**; responsive; consistent with sitemap hierarchy. | `/components/navigational/breadcrumbs` |
| **Avatar** | Three contexts only: initials / image / icon. | `/components/data-display/avatar` |
| **Rating** | Normal, Pressed; Selected, Half; apply component fully without modification. | `/components/feedback/rating` |
| **Tooltip** | Placement (top/bottom/right/left) + alignment (start/center/end). | `/components/feedback/tooltip` |
| **Table** | Follow Platforms Code table spec. | `/components/data-display/table` |

### 4.2 Secondary components `[S3]`
| Component | Guideline URL `[S1]` |
|---|---|
| **Nav Drawer** (side navigation) | `/components/ui-shell/navigation-drawer` |
| **Pagination** | `/components/navigational/pagination` |
| **Loading** | `/components/loading-and-status/loading` |
| **Steps** | `/components/forms-and-inputs/steps` |

---

## 5. Experience (التجربة) `[S3]`

- **Visual hierarchy:** design directs attention to important elements first.
- **Navigation:** intuitive, logical grouping/labeling of sections & links.
- **Efficiency:** common tasks completable with minimal steps, intuitive interactions.
- **Help resources:** accessible, clear, useful.
- **Language:** clear, concise, audience-appropriate; assess localization.
- **Predictability:** UI behaves predictably; reduces confusion/errors.
- **Consistent interaction patterns:** gestures, clicks, navigation consistent → learnable.
- **Content tone:** uniform style/tone appropriate for audience.
- **Consistent feedback:** immediate, clear visual feedback on interaction; consistent style/timing.
- **Motion rule:** never hide important elements (buttons/content) behind animations; keep always visible.
- **Gestures:** support swipe, long-press, scroll naturally on touch devices.
- **Sitemap:** provide a comprehensive, up-to-date sitemap; consistent with nav header, footer, breadcrumb.
- **Feedback mechanism:** clear method for users to submit feedback (standardized evaluation form); **confirmation message** after submission.
- **Privacy & security notices:** visible, clear, accessible; present at key interaction points (login/registration/data collection); placed in familiar spots (footer or first-visit popup).
- **Terminology consistency:** unified terms across screens; follow approved language guide; each term clearly reflects its function; avoid repetition/multiple expressions for same meaning.
- **Error handling consistency:** same visual style/placement per context; clear, concise wording explaining the problem and how to resolve (e.g., "تم حفظ البيانات بنجاح", "الرجاء إدخال البريد الإلكتروني").
- **Search results:** organized by predefined categories; user-selectable filters (content type, publish date).

---

## 6. Cross-cutting mandatory artifacts

| Artifact | Requirement `[S3]` |
|---|---|
| **Sitemap** | Comprehensive & up to date; built from nav header/footer/breadcrumb structure. |
| **Feedback form** | Standardized evaluation form + confirmation. |
| **Privacy/security notice** | Visible + accessible + at key points. |
| **Responsive behavior** | Mobile/Tablet/Desktop reflow. |
| **Arabic-first / RTL** | Primary language + default direction. |

---

## 7. What is NOT specified by verifiable sources (→ `QUESTIONS.md`)

Exact hex colors, full spacing scale, per-variant type scale, breakpoint pixels, e-Participation 8-section names/order, home-page section list, digital-stamp applicability to this platform, official icon inventory names, and whether IBM Plex Sans Arabic is loaded self-hosted or via approved CDN. These are **not invented here**; they are open items.
