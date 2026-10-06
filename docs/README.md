# Expert Hub — documentation

**Platform:** Expert & Independent Trainer Management Platform, Financial Academy (الأكاديمية المالية)
**Business source:** `BRD-TRN-001 v1.0` ([`inputs/BRD-TRN-001-expert-hub-v1.0.pdf`](inputs/BRD-TRN-001-expert-hub-v1.0.pdf)).
Where the BRD is silent, an item is flagged as an assumption or an open question,
never invented.

## Where to start

| You want to… | Read |
|---|---|
| Pick the work up where it stopped | the newest record in [`sessions/`](sessions/). It opens with *Resume here* |
| Know why something is the way it is | [`DECISIONS.md`](DECISIONS.md) (business rulings, `P-xxx`) and [`adr/`](adr/) (architecture) |
| Build or change a journey | [`journeys/`](journeys/) (the approved journeys) and [`specification/11_JOURNEY_IMPLEMENTATION_MAP.md`](specification/11_JOURNEY_IMPLEMENTATION_MAP.md). Where a journey and a page spec disagree, **the journey wins** |
| Change the data model | [`specification/10_DATABASE_DESIGN.md`](specification/10_DATABASE_DESIGN.md) and the generated [`schema.d2`](schema.d2) |
| Deploy or operate it | [`operations/DEPLOYMENT.md`](operations/DEPLOYMENT.md) |
| Know what is still waiting on someone | [`specification/15_INPUTS_REGISTER.md`](specification/15_INPUTS_REGISTER.md) and [`reviews/business-review-2026-10-01.md`](reviews/business-review-2026-10-01.md) |

## Layout

| Folder | Holds |
|---|---|
| [`specification/`](specification/) | The numbered specification set (`01_PRODUCT_DISCOVERY` … `28_API_CONTRACT_INVENTORY`), from discovery through architecture, integrations and release readiness |
| [`journeys/`](journeys/) | J-01 … J-24, the catalog and the capability matrix; [`journeys/ar/`](journeys/ar/) has the Arabic versions supplied |
| [`inputs/`](inputs/) | Business source material: the BRD, the application form and certification workbooks, the FAST field inventories, the relevance policy workbook |
| [`integrations/`](integrations/) | The FAST portal API reference and register |
| [`operations/`](operations/) | Deployment, UAT plan, journey and traceability matrices, external dependencies |
| [`reviews/`](reviews/) | Business reviews and their remediation records |
| [`design-system/`](design-system/) | FADS: the Figma component specifications, tokens, icons, compliance workflow |
| [`adr/`](adr/) | Architecture decision records |
| [`sessions/`](sessions/) | One record per working session: the narrative, verbal rulings, corrections, how to resume |
| [`archive/`](archive/) | Superseded plans, working reports and the Hackathon material, kept for history |

## Platform at a glance

- **3 interfaces, 1 core:** trainer portal (self-service), internal dashboard (operations), public interface (directory and landing page).
- **5 service types:** trainer, consultant, content developer, question writer, speaker. A speaker is a limited record type: no contract and no portal.
- **12 capabilities (CAP-01 → CAP-12):** application, screening & evaluation, agreement, trainer profile, assignment & matching, entitlement (ERP), communication, access & permissions, analytics, public presence, professional community *(deferred)*, integration.
- **Integrations:** Academy SSO / FAST identity (INT-01), trainee evaluation / MTM (INT-02), ERP (INT-03), email (INT-04), FAST portal API (INT-05), AI provider (INT-06).
- **Design system:** DGA "كود المنصات", through FADS. There is no separate visual identity.

## Foundational constraints (from the BRD)

- Authentication is **external** (Academy SSO, INT-01), a hard dependency with **no alternative auth path** (`BR-0808`, `NFR-13`).
- The platform **consumes** authoritative data (ERP, evaluations, FAST) and never edits it in place (`BR-1201/1202`).
- Fully **bilingual (AR/EN)** with **RTL** support, and notifications go out in the recipient's single primary language (`BR-0707`).
- An **immutable audit log** covers every sensitive action (`NFR-07`).
