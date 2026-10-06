# Journey J-15 — Trainer Search & Unified Profile Review

**Journey Name (AR):** البحث الموحّد ومراجعة الملف الشامل للمدرب

**Interface:** Internal Dashboard

---

### Journey Scope

Covers staff searching/filtering the trainer database purely to browse and monitor — locating a specific trainer, checking their current status, reviewing their complete profile, and exporting their identity card. This is a look-up and oversight tool, not a candidate-selection mechanism — sourcing trainers for a specific assignment/event is handled entirely in J-17.

---

### User Flow

1. Staff opens the trainer database from the Internal Dashboard to browse or locate a specific trainer
2. They search/filter to find who they're looking for
3. They open a trainer's unified profile, viewing all their data in one screen
4. They check the trainer's file status
5. Staff can export the trainer's identity card to share externally

---

**Supporting Matrix: Identity Card Template Fields**

| # | Field | Source |
| --- | --- | --- |
| 1 | Photo | Trainer Profile |
| 2 | Name | Trainer Profile |
| 3 | Experience | Trainer Profile |
| 4 | Academic Qualifications | Trainer Profile |
| 5 | Related Fields | Trainer Profile |
| 6 | Professional Certifications/Memberships | Trainer Profile |
| 7 | Social Media Accounts | Trainer Profile |

---

## Key Features & Functionality

**F1. Unified Trainer Profile View**
Description: Staff view a trainer's complete data in one screen — personal data, their record with the Academy, evaluations, active agreement, and file status.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given staff open a trainer's profile, then they view the trainer's complete data in one screen, including: full personal data, their record with the Academy (programs/participations), evaluations (with last sync date), active agreement, and file status *(US-0402, US-0404, US-0407, US-0409, US-0412, US-0415, BR-0407)* |
| AC-2 | Given a trainer's profile, then their file status is displayed *(BR-0408)* |
| AC-3 | Given the trainer database, then staff can search/filter by: service, general specialization, domain, number of professional certifications, experience, evaluation, and file status — for browsing and monitoring purposes *(US-0414)* |

**F2. Identity Card Export**
Description: Staff export a trainer's identity card — a defined entity generated from the trainer's profile — as a PDF in the approved design template.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a trainer's profile, then staff can export their **Identity Card** — a defined entity populated directly from the Trainer Profile fields per the matrix above, with no additional content or custom wording — as a PDF, in the approved design template *(US-0421)* |

---

---

### Open item

1. Detailed search filter list (dropdowns/ranges) — to be resolved at Page Inventory.

---

##