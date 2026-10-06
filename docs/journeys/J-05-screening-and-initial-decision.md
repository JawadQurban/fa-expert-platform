# Journey J-05 — Screening & Initial Decision

---

**Journey Name (AR):** الفرز الأولي واتخاذ القرار

### **Interface:**

Internal Dashboard

---

### Journey Scope

Covers the completed application entering the screening queue, its display/filtering in the screening list, automatic score calculation per Evaluation Matrix, AI-assisted qualitative analysis, the screening manager's detailed review (including attachments), the decision (partial/full acceptance by service with mandatory interview scheduling or exemption, or full rejection), and the persistence of evaluation results to the trainer's record. Ends once the decision is issued — accepted service(s) move to J-06 or J-09 (if exempted), full rejection ends the application's path.

---

### User Flow

1. The application submitted from CAP-01 enters the screening queue and appears in the screening requests list
2. A score is automatically calculated for each service within the application, per that service's Evaluation Matrix
3. AI analyzes the qualitative questions in the application form, producing a separate assistive insight
4. The screening manager opens the application from the list, landing on the Application Insight Page
5. They navigate the form sections field by field, review requested services, scores, AI insight, uploaded attachments, and remaining SLA time
6. On acceptance: if multi-service, the manager specifies exactly which service(s) they're accepting; unselected services are auto-rejected with a system alert
7. For each accepted service, the manager either schedules interview date/time slots or applies an interview exemption — one of the two is mandatory
8. Accepted services with interview slots move to J-06; exempted services move directly to J-09
9. On rejection: the manager is warned this rejects the **entire application**, and asked to confirm
10. On confirming full rejection, a reason is selected from the approved rejection reason list
11. Every calculated score is saved as a permanent Evaluation Result linked to the applicant/trainer's record, accessible to staff at any time afterward

---

### Supporting Matrix: Evaluation Matrix (Screening Criteria & Weights)

| # | Criterion (Source Section) | Trainer | Consultant | Content Developer | Question Writer |
| --- | --- | --- | --- | --- | --- |
| 1 | Educational Qualifications (Section 2) | ? | ? | ? | ? |
| 2 | Professional Certifications (Section 3) | ? | ? | ? | ? |
| 3 | Practical Experience (Section 4) | ? | ? | ? | ? |
| 4 | Training Experience & Content (Section 5) | ? | ? | ? | ? |
| 5 | Availability & Readiness (Section 6) | ? | ? | ? | ? |

*(Weights per service column sum to 100% — pending values, DM-GAP-02)*

---

### Supporting Matrix: Screening Filters & Values

Filters resolved separately in this dedicated matrix — covering standard filters (service type, domain, qualification type, delivery mode preference, ready material availability, availability range, submission date) and smart/derived filters (score range, SLA status, years of experience range, multi-service flag, source: self-submitted vs. internal nomination).

---

## Key Features & Functionality

### **F1. Screening Requests List**

Description: A screen listing all applications currently in the screening queue, filterable per the Screening Filters & Values matrix.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | The list displays one row per application, showing: applicant name, requested service(s), submission date, and SLA status (within SLA / approaching / breached) |
| AC-2 | The list is filterable per the Screening Filters & Values matrix |
| AC-3 | Opening any application from the list navigates directly to the Application Insight Page (F2) |
| AC-4 | Applications re-submitted after a prior rejection appear and are treated as entirely new applications — no prior history or score is shown within this journey |

---

### **F2. Application Insight Page**

Description: A dedicated page per application, consolidating everything the screening manager needs to review and decide — form data, scores, AI insight, attachments, and SLA status — in one place.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | The page displays the requested service(s) clearly at the top |
| AC-2 | The screening manager can navigate through the form's 6 sections, reviewing each field individually |
| AC-3 | The page displays the calculated objective score for each service within the application separately — no single combined score |
| AC-4 | The page displays the AI insight/summary for qualitative questions, kept fully separate from the objective score |
| AC-5 | When any service's objective score falls below an approved minimum threshold, the page shows a visual indicator — for display purposes only, with no automated effect on the decision *[threshold value: pending confirmation]* |
| AC-6 | The page displays this specific application's SLA status (time remaining or elapsed overdue) |
| AC-7 | The accept/reject decision (F5) is taken directly from this page |
| AC-8 | The screening manager can browse/preview all attachments uploaded with the application (CV, certificates, etc.) directly from this page |

---

### **F3. Automatic Objective Score Calculation**

Description: Each service's score within the application is calculated automatically per its Evaluation Matrix, with no human or AI input involved in the official figure.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Each service's score within the application is calculated via a fixed weighted formula, per that service's evaluation model *(BR-0201)* |
| AC-2 | No AI-generated input is merged into the official score under any circumstance *(BR-0201)* |
| AC-3 | The score is built exclusively from the criteria defined in the Evaluation Matrix, per each criterion's approved weight |
| AC-4 | The evaluation model is managed as an independent, system-admin-editable configuration without technical deployment; each service has its own criteria/weights *(BR-0203)* |

---

### **F4. AI Analysis of Qualitative Questions**

Description: An assistive analysis, fully separate from the official score, limited to the qualitative question fields within the application form only.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | AI analyzes only the qualitative questions within the application form, producing a separate score/summary shown as assistive information *(BR-0202)* — *[exact fields defined as "qualitative questions": pending final confirmation]* |
| AC-2 | AI output is never merged into the official score under any circumstance *(BR-0202)* |
| AC-3 | AI does not analyze any attachments (CV, certificates) — limited strictly to text-based qualitative question fields |

---

### **F5. Initial Screening Decision**

Description: Acceptance happens at the selected-service level (multiple services can be accepted in one decision, each requiring proposed interview slots + assigned committee together, or an exemption); rejection remains a whole-application decision requiring explicit confirmation and a reason.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given "accept" is selected on a multi-service application, then the screening manager must specify exactly which service(s) they're accepting — more than one service can be accepted in the same decision |
| AC-2 | Any service within the application not selected for acceptance is automatically rejected, with a system alert/note logged against the decision |
| AC-3 | Given one or more services are accepted, then the screening manager must either **(a) specify proposed interview slots AND assign interview committee member(s) together, in the same step**, or **(b) apply an interview exemption** *(BR-0205, BR-0216 — exemption detailed in J-08; committee assignment mechanics detailed in J-06/F1)* |
| AC-4 | Given acceptance is confirmed without either **(slots + committee together)** or an exemption fully provided, then the decision cannot be finalized — the system blocks completion until one full condition is met |
| AC-5 | Given slots and committee are both provided, then **only the accepted service(s)** move to J-06, carrying both elements — proposed interview slots and assigned committee members *(BR-0205)* |
| AC-6 | Given an exemption is applied instead, then the accepted service(s) skip J-06 and move directly to J-09, per the exemption path in J-08 |
| AC-7 | Given "reject" is selected, a warning is shown clarifying this rejects the **entire application** (all its services), requiring explicit confirmation before finalizing |
| AC-8 | Given full rejection is confirmed, then it cannot be completed without selecting a reason from the approved rejection reason list *(BR-0219)* |
| AC-9 | Given a partial acceptance decision (some services accepted, others auto-rejected), then the applicant receives one combined notification, clearly listing which specific service(s) were accepted |

---

Still pending your call on the J-06/F1 overlap question — repeating it here since it's unresolved:

**Keep J-06/F1 as documentation of the same act from J-06's perspective** (with a note it's executing what J-05/F5 decided), **or remove J-06/F1 entirely** and have J-06 start directly at applicant notification, since the actual assignment now lives fully in J-05/F5?

---

### **F6. Evaluation Result — Persistence & Later Access**

Description: The score produced by the Evaluation Matrix is saved as a permanent Evaluation Result linked to the applicant/trainer's record — not a transient screening-moment value — viewable by staff at any time afterward, regardless of the screening decision's outcome.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a service's score is calculated via the Evaluation Matrix, then it is saved as a persistent Evaluation Result record linked to the applicant/trainer's record — not discarded after the screening decision |
| AC-2 | Given a saved Evaluation Result, then authorized staff can review it at any time afterward, independent of where the application currently stands |
| AC-3 | Given a saved Evaluation Result, then it remains linked to the record regardless of the screening decision's outcome |
| AC-4 | This result's surfacing within the Trainer's full profile view is handled separately in J-15 — not detailed here |

---

### Open items — pending

1. Evaluation Matrix weights — pending upload (DM-GAP-02)
2. Insight Page score threshold value — pending
3. Exact fields defined as "qualitative questions" — pending
4. Applicant notification on partial acceptance — per-service breakdown or combined message? — resolved at J-26