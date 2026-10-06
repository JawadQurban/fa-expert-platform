# Journey J-04 — Speaker Record Management

**Journey Name (AR):** إدخال وإدارة سجل متحدث

### **Interface:**

Internal Dashboard

---

### Journey Scope

Covers speaker record creation and updates, its visibility within trainer records, search, and the accumulation of participation history over time.

---

## User Flow

1. Staff opens the "Add Speaker" screen from the Internal Dashboard
2. Staff fills in speaker data per the Speaker Fields matrix
3. Staff saves the record
4. The record appears within the trainer records list
5. Staff updates speaker data, or searches the speaker database, as needed

---

## **Supporting Matrix: Speaker Fields** *(not yet approved — pending upload)*

| # | Field | Notes |
| --- | --- | --- |
| — | *Pending matrix upload* | — |

---

## Key Features & Functionality

## **F1. Speaker Record Management (Create & Update)**

Description: Staff creates and updates a speaker record from the Internal Dashboard, independent of any event.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | The speaker record can only be created from the Internal Dashboard — no path exists to create it from the Trainer Portal or any external source *(BR-0113)* |
| AC-2 | The record is created per the Speaker Fields matrix, independent of any occasion — no event needs to exist at creation time |
| AC-3 | The speaker record is never subject to profile creation, evaluation, or agreement/financial entitlement *(BR-0413)* |
| AC-4 | The speaker receives a notification **via email** immediately upon record creation |
| AC-5 | All record fields remain editable from the Internal Dashboard at any time *(BR-0412)* |

## **F2. Speaker Visibility & Discoverability**

Description: The speaker record appears within the unified trainer records list with a distinct classification, and is searchable/filterable.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | The speaker record appears within the unified trainer records list, tagged "Speaker" — distinct from Trainer/Consultant/Content Developer/Question Writer |
| AC-2 | The "Speaker" classification cannot be upgraded to an approved service classification through this journey — conversion to Trainer follows the normal application path (J-01/J-02) |
| AC-3 | The speaker database can be searched/filtered by name, specialization, or field |

## **F3. Speaker Participation History**

Description: Any linking of the speaker's name to an event via FAST is automatically reflected in their persistent record, forming cumulative history.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | When the speaker's name is linked to an event via FAST, this is automatically reflected in their persistent record — no manual entry required from within the platform |
| AC-2 | Staff can view the full historical log of participations accumulated this way |

---

### Open items

1. Speaker Fields matrix — pending upload.
2. Notification template — to be added to the Notification Matrix (J-26).
3. FAST integration scope (INT-05) doesn't explicitly mention speaker-event linking — needs expansion or documentation as a new integration point.