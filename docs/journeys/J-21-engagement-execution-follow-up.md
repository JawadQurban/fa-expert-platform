# Journey J-21 — Engagement Execution Follow-up

> ⚠️ **F6/AC-2 amended 2026-09-02 by owner ruling (`P-200`).** This journey
> says trainee evaluations reach the platform «عبر تكامل مباشر بين المنصة
> وMTM — دون فاست كوسيط». That is superseded: «MTM the data is on FAST
> already so we don't need it». MTM's `Survey.Instructor` and
> `Survey.SurveyResponse` arrived inside the FAST data dictionary, and FAST
> also carries the pre-aggregated rating rollups — so **FAST is the carrier**,
> INT-02 is not a separate connection, and `G41`–`G44`, `G28`, `G57`/`G58` and
> `Q29` are cancelled. MTM remains the *master* of the evaluation data, so
> `BR-1201` is untouched; what changed is the transport.

**Journey Name (AR):** تنفيذ الارتباط ومتابعة بيانات التنفيذ

**Interface:** Trainer Portal

---

### Journey Scope

Covers the trainer following up on their engagement (active or completed), viewing the online session link or in-person venue, tracking enrollee data in real time, viewing attendance/absence data after the program actually runs, the engagement's automatic completion once its scheduled date passes, and viewing trainee evaluations via a direct MTM integration. Begins once the engagement is confirmed (J-18/F3). Ends once the engagement is archived under "Past Engagements" in the trainer's dashboard.

---

### User Flow

1. The trainer opens their engagement from the "My Engagements" section of their portal
2. They see the full program details; if online, the training session link **(Teams URL)** pulled from FAST
3. As the program date approaches, the trainer tracks the number and names of enrollees in real time
4. Once the program actually runs, attendance/absence data for each enrollee is recorded in FAST and made available to the trainer
5. Once today's date passes the program's scheduled end date, the engagement automatically transitions to "Completed" and moves to "Past Engagements"
6. Trainee evaluations reach the trainer as soon as they're available from MTM — entirely independent of the engagement's completion timing

---

### Key Features & Functionality

**F1. Active Engagement Detail View**
Description: The trainer reviews the full program details linked to their engagement, as long as it hasn't yet completed.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the trainer opens an engagement with "Active" status (not yet completed), then all program/plan data originally pulled in J-16 is displayed |
| AC-2 | Given the engagement's status, then it's clearly shown as **Upcoming** (not yet started) or **In Progress** (within its actual execution period) |
| AC-3 | Given the program is rescheduled or its dates changed in FAST, then the engagement's data is automatically and immediately updated to reflect the new dates, and the trainer receives an immediate notification of the change |

**F2. Session Link / Venue Display**
Description: Depending on delivery mode, the trainer sees either the online session link or the in-person venue, both sourced from FAST.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the program's delivery mode is online, then the training session link **(Teams URL)** is shown to the trainer, pulled from FAST upon engagement confirmation |
| AC-2 | Given the delivery mode is in-person, then the venue is shown to the trainer, pulled from FAST — specifying whether it's inside the Academy or outside it |

**F3. Real-Time Enrollee Tracking**
Description: The trainer tracks the number and names of enrollees in real time, with no additional data about them.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the trainer's engagement, then the number of enrollees is displayed and updates in real time with each new enrollment *(BR-0513)* |
| AC-2 | Given enrollee names, then only their names (Arabic/English) are displayed — no additional data |
| AC-3 | Given the source, then it is FAST's enrollee table (PlanTaker) |

**F4. Attendance/Absence Data Display**
Description: After the program actually runs, attendance/absence data is recorded in FAST and made available to the trainer as an additional layer on top of the enrollee list.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the program has actually run, then attendance/absence data for each enrollee is recorded in FAST *[exact FAST field name: Pending — not present in the previously reviewed data file]* |
| AC-2 | Given this data is recorded, then it becomes available to the trainer as an additional layer on top of the enrollee list (F3) — not a replacement |

**F5. Engagement Completion (Trainer's Perspective)**
Description: The engagement automatically completes once today's date passes its scheduled end date — based purely on actual schedule data, independent of any later administrative action.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the engagement, then it automatically completes once today's date exceeds its schedule end date (last `PlanScheduleDay.EndDate`) — at that moment, the engagement's status automatically transitions from "Active" to **"Completed"**, regardless of any later administrative action in FAST |
| AC-2 | Given this transition, then the engagement automatically moves from the active engagements list to the **"Past Engagements"** section of the trainer's dashboard |
| AC-3 | Given this transition, then it is the same trigger that feeds "related requests" on the Trainer Profile (J-13/F1/AC-5) and the "Academy record" on the unified profile view (J-15/F1) |

**F6. Trainee Evaluation Display**
Description: Trainee evaluations reach the trainer as soon as they're available from MTM, entirely independent of the engagement's completion status.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given trainee evaluations become available, then they are shown to the trainer within the engagement's own page as soon as received from MTM — with no dependency on the engagement's completion status |
| AC-2 | Given the evaluation source, then it is a direct integration between the platform and MTM — without FAST as an intermediary |
| AC-3 | Given each survey/evaluation received from MTM, then it is linked to a trainer name and a program name |
| AC-4 | Given evaluations arrive before or after the engagement completes, then they appear within the engagement page regardless — evaluations are fully independent of the completion trigger |

---

### Open items

1. **Exact FAST field name** for attendance/absence data (F4) — pending confirmation, not present in the previously reviewed data file.