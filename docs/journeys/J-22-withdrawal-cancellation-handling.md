# Journey J-22 — Withdrawal / Cancellation Handling

**Journey Name (AR):** الاعتذار أو الإلغاء

**Interface:** Trainer Portal (trainer withdrawal) / Internal Dashboard (staff de-linking) / Automatic receipt from FAST (plan cancellation)

---

### Journey Scope

Covers three fully independent scenarios, each with its own trigger and path:

1. **Trainer withdrawal** from a confirmed engagement before its execution date
2. **Staff de-linking** — removing a specific trainer from a plan (not cancelling the plan itself)
3. **Full plan cancellation from FAST** — received as a notification only, outside the platform's control

Begins with an existing active confirmed engagement (from J-18). Ends once the engagement is terminated and its status clearly updated, with all relevant parties notified.

---

### User Flow

**Scenario 1 — Trainer Withdrawal:**

1. The trainer opens their confirmed engagement from "My Engagements" in their portal
2. They select "Withdraw" and choose a reason (or free text)
3. Staff are notified immediately; the trainer's engagement for that slot is terminated
4. The slot returns to the re-matching path (J-19)

**Scenario 2 — Staff De-linking:**
5. Staff open a confirmed engagement from the Internal Dashboard and select "De-link"
6. They choose a reason (or free text)
7. The trainer's engagement for that slot is terminated; the plan itself remains unchanged in FAST
8. The trainer is notified of the de-linking
9. The slot returns to the re-matching path (J-19)

**Scenario 3 — Full Plan Cancellation from FAST:**
10. The plan is cancelled entirely from within FAST
11. The platform receives an automatic notification that the plan was cancelled, with the cancellation reason (from FAST's own reason list)
12. All trainer engagements linked to that plan are automatically terminated
13. Every linked trainer is notified that their engagement was cancelled due to the full plan cancellation

---

### Key Features & Functionality

**F1. Trainer Withdrawal from Confirmed Engagement**
Description: The trainer terminates their own confirmed engagement, selecting a reason from a simple general-purpose list, before the execution date.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a confirmed engagement, then the trainer can select "Withdraw" from within "My Engagements" |
| AC-2 | Given withdrawal, then the trainer selects a reason from a simple, high-level list: **Personal Emergency**, **Scheduling Conflict**, or **Other** (free text) |
| AC-3 | Given the withdrawal is confirmed, then only the trainer's engagement for this specific slot is terminated — no effect on other slots under the same original request |
| AC-4 | Given the withdrawal, then the responsible staff member is notified immediately |
| AC-5 | Given the withdrawal is finalized, then the slot automatically returns to the re-matching path (J-19) |

**F2. Staff De-linking of a Trainer**
Description: Staff remove a specific trainer from a plan without affecting the plan itself in FAST.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a confirmed engagement, then staff can select "De-link" from the Internal Dashboard |
| AC-2 | Given de-linking, then staff select a reason from a simple, high-level list: **Operational Need Change**, **Administrative Decision**, or **Other** (free text) |
| AC-3 | Given the de-linking is confirmed, then only the trainer's engagement for this specific slot is terminated — the plan itself remains unchanged in FAST; this is a platform-side unlinking only, not a FAST cancellation |
| AC-4 | Given the de-linking, then the trainer is notified, along with the selected reason |
| AC-5 | Given the de-linking is finalized, then the slot automatically returns to the re-matching path (J-19) |

**F3. Receiving Plan Cancellation from FAST**
Description: When a plan is fully cancelled from within FAST, the platform receives an automatic notification, terminates all linked trainer engagements, and clearly updates their status.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a plan is fully cancelled within FAST, then the platform receives an automatic notification, along with the cancellation reason from FAST's own cancellation reason list *(`PlanCancelReasonId`/`CancelReasonOther`)* |
| AC-2 | Given plan cancellation, then there is no path to cancel a plan manually from within the platform under any circumstance — cancellation originates exclusively from FAST |
| AC-3 | Given the cancellation notification is received, then all confirmed trainer engagements linked to that plan are automatically terminated |
| AC-4 | Given termination, then every linked trainer is notified that their engagement was cancelled, clarifying the reason is the full cancellation of the plan by the Academy |
| AC-5 | Given a trainer's engagement is terminated due to plan cancellation, then that engagement's status in the trainer's portal automatically updates to **"Cancelled"** — a status clearly distinct from "Completed" (J-21/F5) and "Withdrawn" (result of trainer withdrawal or staff de-linking) |
| AC-6 | Given the "Cancelled" status, then the engagement appears within the "Past Engagements" section of the trainer's portal, along with the cancellation reason |

---

###