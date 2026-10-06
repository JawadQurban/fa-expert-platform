# Journey J-06 — Interview Scheduling & Confirmation

**Journey Name (AR):** جدولة المقابلة وتأكيدها

**Interface:** Trainer Portal

---

### Journey Scope

Covers notifying the applicant of proposed interview slots (already prepared together with the committee in J-05), their selection of a slot or reschedule request, the automatic creation of the Teams meeting via integration upon confirmation, interview ticket issuance, notification of all parties, and rescheduling when needed. Begins upon receiving the J-05 decision (slots + assigned committee together). Ends once a slot is confirmed and interview setup is complete — interview evaluation itself is covered in J-07.

---

## User Flow

1. The applicant receives a notification (email + in-platform) that interview slots are available — already prepared together with the committee at the J-05 decision
2. They open their portal and select a slot from the proposed times — or request a reschedule if none suit them
3. Once the applicant confirms a slot, the Teams integration automatically creates a meeting, adding the applicant and all pre-assigned committee members as direct participants
4. The system issues an interview ticket linked to that meeting
5. The applicant and committee members receive an automatic Teams invite, alongside a parallel platform notification with the same time and link
6. If any party needs to change the confirmed time, a reschedule is requested, repeating the same flow for a new time, while retaining the same interview ticket and automatically updating the Teams meeting

---

## Key Features & Functionality

### **F1. Interview Slot Notification & Selection**

Description: The applicant is notified of the proposed interview slots (already prepared together with the committee) and confirms their preferred one from within their own portal.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the J-05 decision is finalized (slots + committee together), then the applicant receives an email and an in-platform notification informing them slots are available *(BR-0206)* |
| AC-2 | Given the notification, then the applicant must select/confirm their slot from the "Manage Applications" section of the Trainer Portal — the email is a notification channel only, never the place where the action is taken *(BR-0206)* |
| AC-3 | Given none of the proposed slots suit the applicant, then they can request a reschedule (F4) instead of selecting |
| AC-4 | Given the applicant has not selected a slot, then they have 3 business days to do so, with reminders sent per the Notification Matrix (CAP-07) *(SLA table)* |
| AC-5 | Given the applicant confirms a slot, then the interview status updates to confirmed and is reflected in their tracked application status |

---

### **F2. Automatic Teams Meeting Creation (Integration)**

Description: Upon the applicant's confirmation of a slot, the system automatically creates a Teams meeting via integration, adding the applicant and all committee members pre-assigned in J-05 — with no manual creation step.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the applicant confirms a slot, then the system automatically creates a Teams meeting at that same moment, via the integration |
| AC-2 | Given the meeting is created, then the applicant and all committee members assigned in J-05 are added automatically as direct participants — no manual entry |
| AC-3 | Given the meeting is created, then the system issues an interview ticket at this point, with a unique number linked to the applicant's name, recording the resulting Teams meeting link within it |
| AC-4 | Given the interview ticket exists, then all individual and final interview evaluations (J-07) are recorded against it |

---

### **F3. Interview Notifications**

Description: All parties receive an automatic Teams invite, in parallel with the platform's own notification carrying the same time and link.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | In parallel with the automatic Teams invite (F2), the system sends its own notification (email + in-platform) to all parties (applicant, committee members), carrying the same interview time and link |
| AC-2 | Given a committee member responds to the notification (Confirm/Maybe/Decline), then this response never affects whether the interview takes place — it proceeds as scheduled regardless of RSVP status |

---

### **F4. Reschedule Request**

Description: Either the applicant or the committee can request a reschedule, whether because no proposed slot works or to change an already-confirmed time.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given none of the proposed slots suit the applicant, then they can request a reschedule instead of selecting |
| AC-2 | Given a confirmed slot, when the applicant wants to change it, then they can request a reschedule from the Trainer Portal |
| AC-3 | Given a confirmed slot, when the committee/screening manager needs to change it, then they can trigger a reschedule from the Internal Dashboard |
| AC-4 | Given a reschedule is triggered (at any time, by any party), then new proposed slots are set, and the same selection-and-confirmation flow (F1) repeats |
| AC-5 | Given a new slot is confirmed after a reschedule, then the Teams meeting is cancelled/recreated automatically via the same integration (F2), and all parties are re-notified (F3) |
| AC-6 | Given a reschedule occurs, then the same interview ticket is retained (F2/AC-3) — a reschedule does not generate a new interview numbe |

---

### Open items — not yet resolved

1. **Teams API integration** — not currently documented in the Integration Table (CAP-12) — needs to be added later.
2. **Full committee unavailability / screening manager unavailability** — ties to the Interview Exemption logic — resolved in J-08.
3. **Applicant no-show** (confirmed, didn't apologize, didn't attend) — not yet resolved.
4. **Maximum number of reschedules allowed** — not defined.

Ready for J-07.