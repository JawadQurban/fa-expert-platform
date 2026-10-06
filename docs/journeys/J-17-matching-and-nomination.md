# Journey J-17 — Matching & Nomination

**Journey Name (AR):** المطابقة والترشيح

**Interface:** Internal Dashboard

---

### Journey Scope

Covers ranking suitable trainer candidates against a submitted assignment request (auto-matching engine or manual search), selecting the candidate pool (3 per required slot), and sending them to the requesting party for approval. Begins once the request is submitted (J-16). Ends once the requesting party approves the required number of candidates — the offer itself is handled in J-18.

---

### User Flow

1. Trainer Management staff opens the submitted assignment request
2. They run the automatic matching engine, or search/filter manually, to identify suitable candidates
3. The engine (or manual search) returns a ranked candidate list, sized to match the required headcount (3 per slot)
4. Staff selects the full pool and sends it to the requesting party, each candidate shown with their identity card and price
5. The requesting party reviews the pool and freely approves the required number, or rejects the entire pool
6. If rejected, the cycle restarts with new candidates (J-19)
7. If approved, each approved candidate moves to J-18 for the assignment offer

---

### **Supporting Matrix: Matching Matrix** — *applies across all service types (Trainer, Consultant, Content Developer, Question Writer)*

| # | Matching Criterion | Trainer Profile Field | Request Field | Type |
| --- | --- | --- | --- | --- |
| 1 | Specialization | Approved specializations | Specialization/Domain (from Program) | Exclusionary |
| 2 | Geographic Location | Trainer's city | Country/City (from Plan) | Exclusionary (unless online) |
| 3 | Scheduling Conflict | Trainer's confirmed engagements | Plan start/end date | Exclusionary |
| 4 | File Status | File status (active) | — | Exclusionary |
| 5 | Language | Trainer's delivery languages | Language (from Plan) | Weighted |
| 6 | Delivery Mode | Trainer's preference/capability | Delivery mode (from Plan) | Weighted |
| 7 | Evaluation/Classification | Trainer's evaluation and classification | — | Weighted |

---

### Key Features & Functionality

**F1. Automatic Matching Engine**
Description: A rule-based engine ranks trainers against the request per the Matching Matrix linking trainer profile fields to request fields, producing a ranked candidate list sized to the required headcount.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a submitted assignment request, then staff can run the matching engine to generate a ranked list of candidates, per the Matching Matrix below *(BR-0502)* |
| AC-2 | Given the ranking, then candidates are excluded entirely if they fail any exclusionary criterion in the matrix |
| AC-3 | Given candidates pass exclusionary criteria, then they are ranked using the matrix's weighted criteria — no weighted criterion excludes a candidate on its own |
| AC-4 | Given the request specifies more than one required headcount (J-16/F4), then the matching engine runs a **single cycle** for the same request, with the candidate pool size expanding per the required headcount — not separate cycles per slot |

**F2. Manual Search & Candidate Selection**
Description: Staff can bypass the automatic engine and search/filter the trainer database directly to build the candidate pool themselves.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a submitted assignment request, then staff can search/filter the trainer database manually and select candidates themselves, instead of relying on the automatic engine *(BR-0503)* |
| AC-2 | Given either matching path (automatic or manual), then the number of candidates sent to the requesting party must reach 3 per required slot (e.g., a request needing 2 trainers → exactly 6 candidates) — no fewer, no more *(BR-0505, generalized to the required headcount)* |

**F3. Candidate Presentation to Requesting Party**
Description: The candidate pool is sent together to the requesting party, each shown with their identity card and price sourced from their active agreement.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the candidate pool is finalized (via either path), then it is sent together to the requesting party in one batch — never sent one at a time *(BR-0505)* |
| AC-2 | Given each candidate, then their identity card (per J-15/F2) and their price (per delivery mode: online/in-class, sourced from their active agreement) are shown alongside them *(BR-0515)* |
| AC-3 | Given no candidate has a conflicting confirmed engagement at the same time, then this exclusion is enforced before presentation, regardless of which matching path was used *(BR-0504)* |

**F4. Requesting Party Approval & Prioritization**

Description: The requesting party reviews each candidate in the pool individually — approving or rejecting each one — then ranks the approved candidates by preference.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the candidate pool is presented, then the requesting party reviews each candidate individually and decides: approve or reject — not a single group-level decision on the whole pool |
| AC-2 | Given one or more candidates are approved, then the requesting party ranks them by preference (1st, 2nd, 3rd...) |
| AC-3 | Given all presented candidates are rejected (zero approvals), then the matching/nomination cycle restarts automatically, generating a new candidate pool *(BR-0506 — full re-routing logic detailed in J-19)* |
| AC-4 | Given at least one candidate is approved, then the top-ranked candidate moves forward to receive the immediate assignment offer for each required slot (J-18); remaining approved candidates stay as ranked backups |

---

### Open items

1. **Matching for non-Trainer services** (Consultant, Content Developer, Question Writer): since their request data matrices are still pending (from J-16), matching criteria for these services aren't defined yet