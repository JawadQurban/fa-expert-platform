# Journey J-18 — Assignment Offer Handling & Response Management

**Journey Name (AR):** إرسال عرض الإسناد وإدارة الرد

**Interface:** Trainer Portal (receiving offer and responding) / Internal Dashboard (tracking responses)

---

### Journey Scope

Covers automatically sending individual assignment offers to top-ranked candidates once approved by the requesting party, the 3-day response window and its expiry handling, automatically advancing to the next-ranked backup on rejection or timeout, engagement confirmation and its appearance on the trainer's dashboard, FAST sync, and training material status check. Begins once the requesting party approves and ranks candidates (J-17/F4). Ends once each slot's engagement is confirmed, or all ranked backups are exhausted (triggering J-19).

---

### User Flow

1. Once the requesting party approves and ranks candidates, the system automatically sends an assignment offer to the top-ranked candidate for each required slot — no additional manual staff action
2. The candidate receives the offer in their portal, with full program/plan details, and has 3 days to respond with accept or reject
3. On accept: the engagement for that slot is confirmed, appears immediately in the "My Engagements" section of the trainer's dashboard, the trainer field on the assigned plan is auto-updated in FAST, and the training material status is checked
4. On explicit reject, or if 3 days pass with no response: staff are notified, and the offer automatically moves to the next-ranked candidate from the same approved list
5. Once all approved and ranked candidates are exhausted without acceptance, re-routing is triggered (J-19)

---

### Key Features & Functionality

**F1. Individual Assignment Offer Sending**
Description: Once the requesting party approves and ranks candidates (J-17/F4), the system automatically sends an individual assignment offer to the top-ranked candidate for each slot — with no further manual action needed.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the requesting party approves and ranks one or more candidates (J-17/F4), then the system automatically sends an assignment offer to the **top-ranked candidate** for each required slot — no additional manual staff action |
| AC-2 | Given a slot, then only the top-ranked candidate receives the offer at any given time; remaining approved (backup) candidates receive nothing until their turn comes on rejection/expiry |
| AC-3 | Given the offer, then it contains the full program/plan details pulled in J-16 (identity brief, dates, price, language, delivery mode, etc.) |

**F2. Candidate Response Window (Accept/Reject/Expiry)**
Description: The candidate has a 3-day window to respond; explicit rejection or silent expiry both trigger the same auto-advance to the next-ranked candidate, with distinct notifications to staff.

**Supporting Matrix: Candidate Response SLA**

| Action | Timeframe | On Expiry |
| --- | --- | --- |
| Candidate responds to assignment offer | 3 days | Offer automatically expires |

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | The candidate can accept or reject the offer from their portal within **3 days** of receiving it |
| AC-2 | Given explicit rejection, then staff are notified immediately, and the offer automatically moves to the next-ranked candidate from the requesting party's approved list *(BR-0507, clarified)* |
| AC-3 | Given 3 days pass with no response, then the offer **automatically expires** (with the same effect as rejection), and moves to the next-ranked candidate |
| AC-4 | Given the offer expires automatically (no response), then the staff member who nominated the candidates is notified specifically — a distinct notification from explicit rejection |
| AC-5 | Given all approved and ranked candidates are exhausted without acceptance (via explicit rejection or expiry), then re-routing is triggered (J-19) |

**F3. Engagement Confirmation & Dashboard Visibility**
Description: On acceptance, the engagement is confirmed and appears immediately in a dedicated section on the trainer's dashboard for ongoing tracking.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the candidate accepts the offer, then their engagement for that specific slot is confirmed |
| AC-2 | Given the engagement is confirmed, then it appears immediately in the **"My Engagements"** section of the trainer's portal dashboard, for them to track ongoing |

**F4. FAST Sync**
Description: Upon engagement confirmation, the trainer field on the exact requested/assigned plan in FAST is updated automatically.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the engagement is confirmed, then `PlanTrainer.TrainerId` in FAST is updated automatically and immediately, linked to the same plan (`PlanId`) the request was submitted for — with no waiting for the remaining required slots on the same request to be filled |

**F5. Training Material Status Check on Confirmation**
Description: Upon engagement confirmation, the plan's training material status in FAST is checked (a defined list of values, not a simple empty/filled attachment) to determine the next path.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the engagement is confirmed, then the `Plan.TrainingMaterialStatusId` field in FAST is checked — its selected value from a defined list (New/Current/Book/Not Available/etc.) |
| AC-2 | Given the value is **anything other than "Not Available"** (i.e., an option carrying actual material), then the material attached under `Plan.TrainingMaterialAttachmentId` is shown to the trainer directly within their engagement/program data |
| AC-3 | Given the value is specifically **"Not Available"**, then the trainer is enabled to upload their own training material (full detail in J-20) |

---

###