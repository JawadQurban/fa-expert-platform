# Journey J-07 — Interview Evaluation & Post-Interview Decision

Journey (Ar)**:** تقييم المقابلة وقرار ما بعد المقابلة

**Interface:** Internal Dashboard

---

### Journey Scope

Covers each assigned committee member submitting their individual interview evaluation (or marking non-attendance), the automatic calculation of the consolidated interview result once all assigned members have responded, and the post-interview decision — forwarding the application to the approval committee, or rejecting it directly. Begins once the interview ticket exists (from J-06). Ends once the application is routed to J-09 (approval committee) or rejected.

---

### Supporting Matrix: Interview Evaluation Model

| # | Axis / Criterion | Weight | Notes |
| --- | --- | --- | --- |
| — | *Pending — axes, criteria, and weights not yet provided* | ? | Per BR-0203 pattern: managed as an independent, service-specific configuration |

*(Each accepted service is scored separately against this model — see F1/AC-2)*

### Supporting Matrix: One Interview Result Calculation

| Rule | Detail |
| --- | --- |
| Formula | Average of all **submitted (attended)** individual evaluations per service |
| Exclusions | "Did not attend" entries are excluded entirely from the average — not counted as zero |
| Trigger | Calculation only runs once every assigned committee member has responded (evaluation or non-attendance) — no partial calculation |
| Per-service | Calculated independently for each accepted service within the application, not a single blended score |

---

### User Flow

1. Each assigned committee member opens the interview ticket from the Internal Dashboard
2. They submit their individual evaluation per the Interview Evaluation Model, separately for each accepted service within the application
3. If they didn't attend, they mark "did not attend" instead of scoring — excluded from calculation
4. Once all assigned members have responded (evaluation or non-attendance), the interview result is automatically calculated per the Result Calculation matrix above
5. The same person who formed the committee and made the initial screening acceptance decision (J-05) reviews the result and chooses: forward the application to the approval committee, or reject it directly
6. On direct rejection, a reason is selected from the platform-wide unified rejection reason list

---

## Key Features & Functionality

### **F1. Individual Interview Evaluation Submission**

Description: Each assigned committee member submits an independent evaluation per service, per the Interview Evaluation Model, or marks non-attendance instead of scoring.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given an assigned committee member opens the interview ticket, then they fill their individual evaluation per the Interview Evaluation Model *(BR-0207)* |
| AC-2 | Given the application has multiple accepted services, then the evaluation captures a separate score/recommendation for each service independently *(BR-0207)* |
| AC-3 | Given a committee member did not attend, then they can mark "did not attend" instead of scoring; this evaluation is excluded from the result calculation |
| AC-4 | Given individual evaluations, then each is independent — no separate approval workflow is created per member *(BR-0207)* |

---

### **F2. Interview Result Calculation**

Description: Automatically computed per the Result Calculation matrix, once every assigned committee member has responded.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | The interview result is not calculated, and the application is not forwarded, until all assigned committee members have responded — no exceptions *(BR-0220)* |
| AC-2 | The result is computed per service as the average of submitted (attended) evaluations only, per the Result Calculation matrix — "did not attend" entries are excluded |

---

### **F3. Post-Interview Decision**

Description: Once the interview result is finalized, the same decision-maker who formed the committee in J-05 forwards the application to the approval committee or rejects it directly.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the interview result is finalized, then the same person who formed the interview committee and made the initial screening acceptance decision (J-05) can either forward the application to the approval committee (J-09), or send a direct rejection for the whole application without going through committee — no other committee member holds this authority *(BR-0208, clarified)* |
| AC-2 | Given direct rejection is selected, then it cannot be completed without selecting a reason from the platform-wide unified rejection reason list *(BR-0219)* |
| AC-3 | Given all assigned committee members mark "did not attend" for an interview, then the decision-maker may trigger a reschedule (J-06/F3) instead of rejecting — with no limit on the number of times this can repeat *(Notion «Resolved Issues», 2026-09-20; `P-344`)* |
| AC-4 | Given a reschedule due to full committee no-show, then the decision-maker retains the option to reject the application directly at any point, selecting a reason from the approved rejection reason list — rescheduling is never forced *(Notion «Resolved Issues», 2026-09-20; `P-344`)* |

---