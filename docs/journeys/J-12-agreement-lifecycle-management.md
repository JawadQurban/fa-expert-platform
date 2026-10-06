# Journey J-12 — Agreement Lifecycle Management

**Journey Name (AR):** إدارة دورة حياة الاتفاقية

**Interface:** Internal Dashboard (renewal, status control, template management) / Trainer Portal (expiry notifications received)

---

### Journey Scope

Begins once an agreement is active (handed off from J-11). Covers expiry date tracking, administrative renewal (with trainer notification), suspension/termination, and the central management of the Agreement Template itself. Addendum handling for new services is already covered in J-03/F3 (Add Service to Approved Trainer) and is referenced here, not rebuilt.

---

### User Flow

1. Upon agreement activation, the system automatically calculates its expiry date based on duration
2. As expiry approaches, both the trainer and Trainer Management staff receive alerts at 90 days, 30 days, and 5 days before expiry
3. Trainer Management staff can renew the agreement administratively, directly, without the trainer going through screening or interview again
4. Upon renewal, the trainer is notified that their agreement has been renewed, along with the new duration
5. Staff can also suspend or end an agreement when needed
6. System Administrator manages the central Agreement Template (fixed text + mergeable structural fields) used across all agreement generation

---

### Key Features & Functionality

**F1. Expiry Date Tracking**
Description: The system automatically calculates and tracks each agreement's expiry date, triggering alerts at defined milestones before expiry.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given an agreement is activated, then the system automatically calculates its expiry date based on its duration (1 year / 3 years) *(BR-0301)* |
| AC-2 | Given 90 days remain before expiry, then both the trainer and Trainer Management staff receive an alert *(BR-0303)* |
| AC-3 | Given 30 days remain before expiry, then both the trainer and staff receive another alert *(BR-0303, extended)* |
| AC-4 | Given 5 days remain before expiry, then both the trainer and staff receive a final alert *(BR-0303, extended)* |

**F2. Administrative Renewal**
Description: Staff renews the agreement directly, without the trainer repeating screening or interview, and the trainer is notified once renewal is complete.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given an agreement nearing or past expiry, then staff can renew it directly as an administrative action, with no requirement to route the trainer back through screening (J-05) or interview (J-06/J-07) *(BR-0304)* |
| AC-2 | Given a first-time approval, then the agreement duration is 1 year; given any subsequent renewal, the duration is 3 years *(BR-0302)* |
| AC-3 | Given renewal is complete, then the trainer receives a notification confirming their agreement was renewed, including the new duration (e.g., "Your agreement has been renewed for 3 years") |

**F3. Agreement Status Control**
Description: Staff can suspend or end an agreement when needed, adjusting the contractual relationship's state.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given an active agreement, then staff can suspend it or end it, per operational need *(US-0305)* |

**F4. Agreement Template Management**
Description: The System Administrator manages the central agreement template — fixed legal text plus the structural fields that auto-merge into generated agreements.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the System Administrator accesses template management, then they can edit the fixed template text and the structural field definitions used for auto-merge across all generated agreements *(US-0307, BR-0306)* |
| AC-2 | Given the template structure, then it is designed to support multiple templates in the future (one template linkable to one or more services), even though a single unified template currently serves all four services *(BR-0307* |

---