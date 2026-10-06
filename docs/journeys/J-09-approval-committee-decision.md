# Journey J-09 — Approval Committee Decision

[Arabic version](ar/J-09-approval-committee-decision.md)

**Journey Name (AR):** قرار لجنة الاعتماد

**Interface:** Internal Dashboard

---

### Journey Scope

Begins the moment the application's creator chooses to forward the application to the approval committee (following the accept/reject decision made in J-07/F3). Covers: the creator forming the approval committee (members, sequence, mandatory/optional status, or reusing a saved template), the committee's sequential review, the applicant's bank data collection triggered in parallel with final approval, and the final result returning to the creator. Ends once the final approval/rejection result — and the applicant's completed bank data — are both available to the creator, who then moves into agreement preparation (J-10).

---

### User Flow

1. The application's creator forms the approval committee: selects members, arranges their sequence, and classifies each member as **mandatory** or **optional** — or selects a previously saved committee template (editable for this specific application without affecting the saved template)
2. The application reaches each member according to the defined sequence
3. Each member takes a decision: approve, reject, or request modification
4. A mandatory member's rejection immediately halts the application; an optional member's rejection is logged as a note only and does not halt the sequence
5. Once all mandatory members have approved, the final approval result returns to the application's creator
6. In parallel, the applicant receives a "preliminary approval" notification asking them to complete their bank data — new fields open in their profile that weren't part of the original application form
7. Once the applicant saves their bank data, the creator is notified that the data is complete and agreement preparation (J-10) can proceed

---

### Key Features & Functionality

**F1. Committee Formation Trigger**
Description: Once the application's creator decides to forward the application to the approval committee (the accept/reject decision itself is covered in J-07/F3), committee formation begins.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the interview result average (from J-07) or exemption status (from J-08) is finalized, and the creator selects "forward to approval committee" (the decision itself is covered in J-07/F3), then approval committee formation (F2) begins |

**F2. Approval Committee Formation**
Description: The application's creator forms the approval committee themselves, defining members, sequence, and mandatory/optional status, with the option to save it for reuse.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given "forward to approval committee" is triggered, then the creator forms the approval committee — selecting members and arranging their approval sequence |
| AC-2 | Within formation, the creator classifies each member as **mandatory** or **optional** |
| AC-3 | The creator can save the formed committee (members + sequence + mandatory/optional status) as a **named, reusable template** for future applications |
| AC-4 | Given a saved committee template exists, then the creator can select it directly instead of rebuilding the sequence from scratch |
| AC-5 | Given a saved template is reused, then the creator can edit its members/sequence for this specific application without altering the saved template itself |
| AC-6 | Given formation is finalized (new or from a saved template), then the approval sequence begins with the first member, triggering F3 |

**F3. Member Notification & Full Context Review**
Description: Each member in the approval sequence receives a notification of their turn, along with the screening result and consolidated final interview result, to make a fully informed decision.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a member's turn arrives in the sequence, then they receive a notification of an application awaiting their approval *(US-0208)* |
| AC-2 | Given the notification/screen, then it displays the initial screening result together with the consolidated final interview result — not the individual evaluations themselves — or the exemption status and reason if applicable *(US-0208)* |

**F4. Sequential Approval Workflow**
Description: A unified decision on the application as a whole, following the mandatory/optional sequence defined in F2, advancing automatically between members, and halting immediately only on a mandatory member's rejection.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | The approval committee's decision is issued on the application as a whole, based on the consolidated result — no separate per-service decisions *(BR-0209)* |
| AC-2 | Given a member approves, then the application automatically advances to the next member in the defined sequence, with no manual delay *(US-0209)* |
| AC-3 | Given a **mandatory** member rejects at any point, then the application immediately halts with a final rejection *(BR-0210, scoped to mandatory members)* |
| AC-4 | The application is not considered "finally approved" until all **mandatory** members have approved; an **optional** member's rejection is logged as a note in the decision record only, with no effect on the sequence continuing or the final outcome *(BR-0211, revised)* |
| AC-5 | Given final approval is complete, then the result returns to the application's creator (F5), and the bank data collection process is triggered in parallel (F6) |

**F5. Result Return to Creator**
Description: Once the committee sequence completes, the final approval/rejection result returns to the application's creator so they can proceed to the next stage.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the approval sequence completes successfully, then a "finally approved" result returns to the creator |
| AC-2 | Given a mandatory member rejects, then a "finally rejected" result returns to the creator |
| AC-3 | Given "finally approved," then the creator's ability to fully proceed to agreement preparation (J-10) depends on the applicant's bank data being complete (F6) |

**F6. Applicant Bank Data Collection** *(new)*
Description: In parallel with final approval, the applicant is notified to complete their bank data, which is required before agreement preparation can proceed.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given final approval is complete, then — in parallel with F5/AC-1 — the applicant receives a "preliminary approval" notification informing them to complete their bank data |
| AC-2 | Given the applicant receives this notification, then new fields open in their profile (Bank Data section) that were not part of the original application form |
| AC-3 | Given the Bank Data section, then the required fields are: bank's country, bank's city, bank name, branch name, IBAN, SWIFT code, name on the bank card, and account number — all mandatory |
| AC-4 | Given the applicant saves their bank data, then the application's creator is notified that the data is complete and agreement preparation can proceed |

**F7. Modification Request**
Description: Any member in the sequence can request a modification instead of approve/reject, with a mandatory note visible to all members.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Any member in the approval workflow may request a modification instead of approving or rejecting, with a mandatory note *(BR-0217)* |
| AC-2 | The modification note is shown to all committee members as a visible alert *(BR-0217)* |
| AC-3 | The application's creator receives the modification note and re-submits the application after correcting it *(US-0218)* |
| AC-4 | Upon re-submission, the workflow resumes from the same member who requested the modification, without affecting approvals already given by prior members *(BR-0218)* |

**F8. Final Rejection**
Description: A mandatory member's rejection immediately and finally rejects the entire application for the trainer.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given "reject" is selected (by a mandatory member), a warning is shown clarifying this action finally rejects the application for the trainer directly, requiring explicit confirmation |
| AC-2 | Given rejection is confirmed, then it cannot be completed without selecting a reason from the platform-wide unified rejection reason list *(BR-0219)* |
| AC-3 | Given rejection is finalized, then the applicant is notified of the outcome and the reason |

---

### Business Rules (from BRD)

BR-0209 (unified decision on the application as a whole) · BR-0210 (mandatory member rejection halts the application) · BR-0211 (final approval requires mandatory members only — revised) · BR-0217 (modification request with mandatory note visible to all) · BR-0218 (workflow resumes from the requesting member) · BR-0219 (no rejection without a reason)

### Clarified Rules — based on your input (new, logged for reference)

1. The application's creator forms the approval committee, defining members, sequence, and mandatory/optional classification.
2. Committee formation can be saved as a named, reusable template, editable per-application without affecting the saved original.
3. An optional member's rejection is a note only, with no blocking effect.
4. Final approval triggers two parallel outcomes: the result returns to the creator, AND the applicant is prompted to complete bank data — both must complete before agreement preparation (J-10) can proceed.
5. Bank data fields are collected as part of the applicant's profile at this stage, not on the original application form.

---

### Open items — pending

1. **Bank data permanence**: is this bank data part of the trainer's permanent profile (CAP-04), reused for future agreements/renewals, or collected fresh each time? This affects J-14/J-15 later — needs confirmation.

Ready for J-10 rebuild based on this.