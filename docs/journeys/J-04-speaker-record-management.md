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

## **Supporting Matrix: Speaker Fields**

From the owner's Notion page *Speaker Record* (Matrices). Built as `SPEAKER_RECORD` (M41, `P-341`).

| # | Field (Arabic) | Field (English) | Type | FAST column named by the matrix |
| --- | --- | --- | --- | --- |
| 1 | الصورة الشخصية | Profile picture | Image file | `profile.UserProfile.ProfileImageAttachmentId` |
| 2 | صفة المتحدث | Speaker title/role | Text | New field |
| 3 | الاسم الأول (بالعربية) | First name (Arabic) | Text | `dbo.AspNetUsers.FirstNameAr` |
| 4 | الاسم الثاني (بالعربية) | Middle name (Arabic) | Text | `dbo.AspNetUsers.MiddleNameAr` |
| 5 | الاسم الثالث (بالعربية) | Third name (Arabic) | Text | `dbo.AspNetUsers.ThirdNameAr` |
| 6 | الاسم الأخير (بالعربية) | Last name (Arabic) | Text | `dbo.AspNetUsers.LastNameAr` |
| 7 | الاسم الأول (بالإنجليزية) | First name (English) | Text | `dbo.AspNetUsers.FirstNameEn` |
| 8 | الاسم الثاني (بالإنجليزية) | Middle name (English) | Text | `dbo.AspNetUsers.MiddleNameEn` |
| 9 | الاسم الثالث (بالإنجليزية) | Third name (English) | Text | `dbo.AspNetUsers.ThirdNameEn` |
| 10 | الاسم الأخير (بالإنجليزية) | Last name (English) | Text | `dbo.AspNetUsers.LastNameEn` |
| 11 | نبذة عن المتحدث | Speaker bio | Multi-line text | New |

⚠️ Needs Confirmation: the matrix marks no field mandatory (Expert Hub requires the Arabic first and last name) and gives no bio length (Expert Hub caps it at 2000).

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

1. ~~Speaker Fields matrix — pending upload.~~ Resolved: Notion *Speaker Record* (`P-341`).
2. Notification template — to be added to the Notification Matrix (J-26). The email address comes from the speaker's FAST profile (`P-342`), which FAST cannot serve yet (B-13, B-16 in the FAST contract), so AC-4 is blocked.
3. FAST integration scope (INT-05) doesn't explicitly mention speaker-event linking — asked of FAST as B-17. F3 shows the history as unavailable until then (`P-344`).
4. Search fields beyond name and title (specialization, field) — to be defined after the speaker record is approved (`P-343`).