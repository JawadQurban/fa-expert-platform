# Journey J-08 — Interview Exemption

**Journey Name (AR):** الاستثناء من المقابلة

**Interface:** Internal Dashboard

---

### Journey Scope

Covers the screening manager's decision to exempt an accepted service from the interview stage entirely, with a reason selected from an approved list, at the same moment the J-05 acceptance decision is made. Begins as an alternative path within J-05/F5's acceptance step (option b). Ends once the exempted service is routed directly to the approval committee (J-09), bypassing J-06 and J-07 completely.

---

## Supporting Matrix: Interview Exemption Reasons

| # | السبب (عربي) | Reason (English) |
| --- | --- | --- |
| 1 | خبير  | expert  |
| 2 | تعاون سابق موثَّق مع الأكاديمية | Documented prior collaboration with the Academy |
| 3 | أخرى (نص حر) | Other (free text) |

---

## User Flow

1. At the moment of accepting a service in J-05/F5, the screening manager chooses "grant exemption" instead of providing interview slots and committee
2. They select a reason from the approved Interview Exemption Reasons list
3. The exempted service skips J-06 (scheduling) and J-07 (evaluation) entirely
4. The exemption decision is recorded against the application's Evaluation Result
5. The exempted service moves directly to the approval committee (J-09)
6. In the applicant's own tracked status, the interview step shows as **passed** — without revealing it was an exemption

---

## Key Features & Functionality

### **F1. Interview Exemption Decision**

Description: At the point of accepting a service, the screening manager can grant an interview exemption instead of scheduling, selecting a reason from an approved list.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the screening manager is accepting a service in J-05/F5, then they may choose to grant an interview exemption instead of providing interview slots and committee *(BR-0216)* |
| AC-2 | Given an exemption is granted, then a reason must be selected from the approved Interview Exemption Reasons list — the exemption cannot be finalized without one *(BR-0216)* |
| AC-3 | Given multiple services are accepted in the same decision, then the exemption applies per selected service — one service can be exempted while another goes through interview scheduling in the same application |
| AC-4 | Given an exemption is granted, then it is recorded on the application's Evaluation Result record, including the exemption status (yes/no) and the selected reason |
|  |  |

---

### **F2. Direct Routing to Approval Committee**

Description: An exempted service bypasses interview scheduling and evaluation entirely, while still appearing as a passed step to the applicant.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a service is exempted, then it skips J-06 and J-07 entirely — no interview slots are proposed, no committee is assigned for that service |
| AC-2 | Given a service is exempted, then it moves directly to the approval committee (J-09) alongside its screening score, with no interview result attached (since none was conducted) |
| AC-3 | Given a service is exempted, then in the applicant's tracked status timeline, the interview step displays as **passed** — without disclosing that it was an exemption |

---