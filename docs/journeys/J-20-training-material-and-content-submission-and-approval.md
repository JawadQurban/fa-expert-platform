# Journey J-20 — Training Material & Content Submission and Approval

**Journey Name (AR):** رفع واعتماد المواد التعليمية

**Interface:** Trainer Portal (submission) / Internal Dashboard (approval)

---

### Journey Scope

Covers two independent submission-and-approval paths: **(1) Training material for the Trainer service** — enabled when no material exists at the plan level in FAST, and **(2) Service-linked content for the Content Developer service** — enabled immediately upon engagement confirmation. Both paths follow the same submission/review/approval principle, but with different triggers and storage destinations. Ends once the material/content is approved (with the trainer's material specifically synced back to FAST).

---

### User Flow

**Training Material Path (Trainer service):**

1. Upon engagement confirmation, if the training material field in FAST is discovered to be "Not Available," an upload slot opens for the trainer in their portal
2. The trainer uploads their training material, per the approved attachment validation rules (J-01)
3. The program coordinator receives an alert that material is awaiting their approval, and reviews it
4. Upon approval, a copy of the material is automatically sent to update the training material field on the plan in FAST

**Content Path (Content Developer service):**
5. Immediately upon confirmation of the content developer's engagement (from the corresponding J-18 path), a content upload slot opens for them in their portal
6. The content developer uploads their work, per the approved attachment validation rules (J-01)
7. The original assignment request's coordinator receives an alert that content is awaiting their approval, and reviews it
8. Upon approval, the approved content is stored within the platform — no external sync to FAST for this path (unlike the training material path)

---

### Key Features & Functionality

**F1. Training Material Upload Enablement When Absent in FAST (Trainer service)**
Description: The trainer is enabled to upload training material exclusively when no approved material exists at the plan level in FAST.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Upload capability is enabled for the trainer only when the training material field in FAST is discovered to hold "Not Available" (J-18/F5/AC-3) |
| AC-2 | The same approved attachment validation rules from J-01 apply to the uploaded file |
| AC-3 | Upon upload, the material's status is recorded within the platform as "Uploaded — Pending Approval" |

**F2. Training Material Review & Approval (Trainer service)**

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the trainer uploads material, then the program coordinator receives an alert that material is awaiting their approval |
| AC-2 | The program coordinator can preview/download the material before deciding |
| AC-3 | The program coordinator's decision is: approve the material, or send a note opening a new upload opportunity for the trainer |
| AC-4 | Given a new upload is requested, then the trainer receives the note and re-uploads, repeating the review cycle (F1-F2) |

**F3. Approved Training Material Sync to FAST**

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the material is approved, then a copy is automatically sent to update the training material field at the plan level in FAST |
| AC-2 | Material status management remains entirely within the platform — sync flows in this direction only (platform → FAST) |

**F4. Service-Linked Content Upload (Content Developer service)**
Description: Immediately upon the content developer's engagement confirmation, they are enabled to upload their service-linked work.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Upload capability is enabled for the content developer immediately upon their engagement confirmation — this path has no dependency on any FAST field |
| AC-2 | The same approved attachment validation rules from J-01 apply to the uploaded file |
| AC-3 | Upon upload, its status is recorded within the platform as "Uploaded — Pending Approval" |

**F5. Service-Linked Content Review & Approval (Content Developer service)**

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the content developer uploads their work, then the original assignment request's coordinator receives an alert that content is awaiting their approval |
| AC-2 | The coordinator can preview/download the content before deciding |
| AC-3 | The coordinator's decision is: approve the content, or send a note opening a new upload opportunity for the content developer |
| AC-4 | Given a new upload is requested, then the content developer receives the note and re-uploads, repeating the review cycle (F4-F5) |
| AC-5 | Given the content is approved, then it is stored within the platform — no external sync to FAST for this path, unlike the training material path (F3) |

---

### 

---

### Open items — not assumed, flagging

1. **Response/approval SLA** for both paths — not currently defined.
2. **Content Developer request-data matrix** (from J-16) is still empty — this path (F4-F5) assumes a "confirmed engagement" for a content developer exists, but the mechanism for reaching that point (matching, offer, acceptance) isn't fully built yet, since this service has no FAST linkage — needs connecting once that service's full path is built.