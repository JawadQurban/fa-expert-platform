# Journey J-19 — Re-routing After Offer Rejection

**Journey Name (AR):** إعادة التوجيه بعد رفض العرض

**Interface:** Internal Dashboard

---

### Journey Scope

Covers what happens when every approved and ranked candidate for a specific slot (from J-18) is exhausted — whether by explicit rejection or response-window expiry — without any acceptance. Begins the moment the last ranked candidate for a slot is exhausted. Ends once new candidates are re-matched and re-sent to the requesting party for a fresh approval cycle (looping back into J-17).

---

### User Flow

1. The last ranked candidate for a slot rejects (or their offer expires) with no remaining backups on the approved list
2. Staff are notified that this specific slot has exhausted all approved candidates
3. Staff re-run the matching engine or manual search for that slot specifically — not the entire original request
4. A new set of candidates is generated and sent to the requesting party for a fresh approval and ranking cycle (J-17/F4)
5. The cycle proceeds exactly as before (J-17 → J-18) for this slot, independent of any other slot on the same request that may already be confirmed

---

### Key Features & Functionality

**F1. Exhausted-Slot Detection & Staff Notification**
Description: The system detects when a specific slot has no remaining ranked candidates and notifies staff to act.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the last ranked candidate for a slot is rejected or their offer expires, then the system detects this slot now has zero remaining approved candidates *(BR-0508)* |
| AC-2 | Given this detection, then staff are notified specifically that this slot requires new candidates — distinct from a single candidate's rejection/expiry notification (already covered in J-18/F2) |

**F2. Slot-Scoped Re-matching**
Description: Staff generate a new candidate set for the exhausted slot only, without disturbing other slots on the same request.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a slot is exhausted, then staff re-run the matching engine or manual search (J-17/F1-F2) scoped to that specific slot only |
| AC-2 | Given other slots on the same original request are already confirmed (engagement accepted), then re-matching for the exhausted slot does not affect or reopen those confirmed slots |
| AC-3 | Given re-matching runs, then the same exclusion rules apply as the original cycle (no conflicting engagement, active file status, specialization, etc.) — with no restriction against candidates previously rejected/expired for this same slot; they can be re-included if still a valid match |

**F3. Fresh Approval & Ranking Cycle**
Description: The newly matched candidates go through the same requesting-party approval and ranking process as the original cycle.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given new candidates are generated for the slot, then they are sent to the requesting party for individual approval/rejection and preference ranking, exactly as in J-17/F4 |
| AC-2 | Given the requesting party approves and ranks the new set, then the offer-sending cycle (J-18) restarts for this slot with the new top-ranked candidate |
| AC-3 | Given a slot exhausts candidates repeatedly, then the same re-matching cycle repeats without limit — no escalation mechanism is triggered |

---

###