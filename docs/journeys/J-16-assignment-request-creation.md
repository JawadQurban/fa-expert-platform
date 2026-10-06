# Journey J-16 — Assignment Request Creation

**Journey Name (AR):** إنشاء طلب إسناد

**Interface:** Internal Dashboard

---

### Journey Scope

Covers the requesting party selecting the required service type, and the path branching by service: for "Trainer" — selecting an existing program/plan from FAST (pull only) and auto-populating its data via API; for other services — filling in service-specific fields per their supporting matrix. Ends once the request is submitted and enters the matching path (J-17).

---

### User Flow

1. The program coordinator/requesting party opens the "Create Assignment Request" screen
2. They select the required service type first (Trainer / Consultant / Content Developer / Question Writer)
3. Given "Trainer" is selected: available programs and plans from FAST are shown for selection
4. Given another service is selected: the fields specific to that service are filled per its supporting matrix
5. Upon selecting a plan (for the Trainer service), the program and plan data are auto-pulled via API from FAST
6. The number of trainers/people needed is specified
7. The request is submitted and enters the matching path (J-17)

---

## Key Features & Functionality

**F1. Service Type Selection**
Description: The first step in any request is selecting the required service type, since each service carries entirely different data and a different path.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the "Create Assignment Request" screen is opened, then the first mandatory field is the service type: Trainer, Consultant, Content Developer, or Question Writer *(BR-0501)* |
| AC-2 | Given "Trainer" is selected, then the FAST Program/Plan Selection step is activated (F2 onward) |
| AC-3 | Given any other service is selected, then the fields specific to that service are activated per its supporting matrix (below) |

**F2. FAST Program/Plan Selection** *(Trainer service only)*
Description: The requesting party selects from programs and plans that already exist in FAST, with no ability to create a new plan from within our platform.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the "Trainer" service is selected, then the screen shows a search list of programs/plans, pulled from FAST, searchable by name or ID |
| AC-2 | Given a plan's status in FAST is "Final Closed," or its end date has passed today's date, then it is excluded from the list |
| AC-3 | No new program or plan can be created from this screen under any circumstance — selection is restricted to what already exists in FAST |

**F3. FAST Program/Plan Data Auto-Pull**
Description: Upon selecting a program/plan, all its relevant data is automatically pulled from FAST via API.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a program/plan is selected, then its data is auto-pulled via API from FAST per the "Trainer Service Request Data" matrix below — no manual entry by the requesting party |
| AC-2 | Given the pulled data, then the identity brief is sourced exclusively from the Program level, while all operational details are sourced from the Plan level — the two sources are never mixed |
| AC-3 | Given all pulled fields are mandatory at their FAST source, then no missing-data scenario is expected here |

**F4. Required Headcount Specification**
Description: The requesting party specifies how many people they need for this request — can be more than one.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the request, then the requesting party specifies the number of people needed (a number, with no defined minimum/maximum) |
| AC-2 | Given a number greater than one is specified, then the request is structured to support nominating/assigning more than one person to the same request downstream (J-17 onward) |

**F5. Assignment Request Submission**
Description: The requesting party submits the completed request, which then enters the matching path.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the request is submitted, then a reference number is generated and linked to it |
| AC-2 | Given submission is complete, then the request enters the matching and nomination path (J-17) |

---

### Supporting Matrix: Trainer Service Request Data

| # | Field | Source | Note |
| --- | --- | --- | --- |
| 1 | Identity Brief | Program | Sourced from Program level only |
| 2 | Program Name (AR/EN) | Program | — |
| 3 | Specialization/Domain | Program | Exclusionary matching criterion |
| 4 | Number of Days | Plan | — |
| 5 | Number of Hours | Plan | — |
| 6 | Program Fee | Plan | Display only — fully separate from trainer's own price |
| 7 | Language | Plan | Weighted matching criterion |
| 8 | Delivery Mode (in-class/online) | Plan | Weighted matching criterion |
| 9 | Country/City | Plan | Exclusionary matching criterion (unless online) |
| 10 | Start/End Date | Plan Schedule | Used to calculate trainer conflict |
| 11 | Meeting Link | Plan | **(Teams URL)** — shown to the trainer later upon engagement confirmation (J-21), if online |
| 12 | Training Material (if any) | Plan | Checked later in J-20 |

---

### Supporting Matrix: Consultant Service Request Data *(empty — pending definition)*

| # | Field |
| --- | --- |
| — | *Pending definition* |

---

### Supporting Matrix: Content Developer Service Request Data *(empty — pending definition)*

| # | Field |
| --- | --- |
| — | *Pending definition* |

---

### Supporting Matrix: Question Writer Service Request Data *(empty — pending definition)*

| # | Field |
| --- | --- |
| — | *Pending definition* |

---

### Open items

1. Request data for the other three services (Consultant, Content Developer, Question Writer) — pending definition.
2. Minimum/maximum headcount in F4 — not currently defined.

Ready for J-17.