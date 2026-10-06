# Journey J-10 — Agreement Preparation & Internal Approval

[Arabic Version ](ar/J-10-agreement-preparation-and-internal-approval.md)

**Journey Name (AR):** إعداد الاتفاقية واعتمادها الداخلي

**Interface:** Internal Dashboard

---

### Journey Scope

Begins once both conditions from J-09 are met: final committee approval and completed applicant bank data. Covers agreement preparation, the creator forming the internal signing sequence (structurally reusing J-09's committee-formation mechanism), and each person in the sequence reviewing/signing the agreement in order. Ends once every person in the sequence has completed their step AND the designated signer(s) have attached their e-signature — at which point the signed agreement is automatically sent to the applicant (J-11).

---

### Supporting Matrix: Editable Agreement Template Fields

*(pending full list — DM-GAP-16; currently confirmed fields are only start date and end date)*

| # | Field | Input Type | Notes |
| --- | --- | --- | --- |
| — | *Pending upload* | — | — |

---

### User Flow

1. Once final approval and applicant bank data are both complete, the application's creator receives an alert to prepare the agreement
2. They enter the editable fields, then the trainer's basic and bank data are auto-merged
3. The creator forms the internal signing sequence — selecting people, arranging their order, and designating who among them is the actual e-signer
4. The document reaches each person in the sequence per their turn; they can preview or download the full agreement
5. A person **not** designated as signer: approves or requests modification — approval automatically advances to the next person
6. A person **designated as signer**: e-signs and approves, or requests modification
7. The signed agreement is automatically sent to the applicant only once the entire sequence is complete **and** the e-signature is attached — not on signature alone

---

### Key Features & Functionality

**F1. Agreement Preparation**
Description: The creator prepares the detailed agreement by first entering editable fields, then the trainer's basic and bank data are auto-merged.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given both final approval (J-09) and completed applicant bank data are met, then the creator receives an alert to prepare the agreement *(US-0211)* |
| AC-2 | Preparation begins with the creator entering the editable fields, then the trainer's basic and bank data are auto-merged afterward — no manual re-entry *(BR-0212, clarified)* |
| AC-3 | Given the interview result determined the approved service(s), then the agreement reflects exactly those services — not more or less *(US-0212)* |

**F2. Internal Signing Sequence Formation**
Description: The creator forms the signing sequence using the same structural mechanism as J-09's committee formation — people, order, mandatory/optional, saved templates — while designating who is the actual e-signer.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given agreement preparation, then the creator forms the internal signing sequence — selecting people and arranging their review order |
| AC-2 | The same mechanics as J-09/F2 apply exactly: mandatory/optional classification per person, and the ability to save the sequence as a named, reusable template |
| AC-3 | **Explicit clarification**: this signing sequence is a distinct entity from J-09's approval committee — the former reviews/signs the final agreement document, the latter decides the application's fate; they are not to be conflated despite the identical structural mechanism |
| AC-4 | Given sequence formation, then the creator designates which person(s) in the sequence are the actual **e-signer(s)** |
| AC-5 | Given formation is complete, then the document is automatically routed to the first person in the sequence |

**F3. Agreement Preview & Approval/Signing**
Description: Each person in the sequence previews or downloads the full agreement, then takes a decision per their role — plain approval, or actual e-signature if designated.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a person's turn arrives in the sequence, then they receive an alert that an agreement awaits their review |
| AC-2 | Given the agreement, then they can preview or fully download it — showing all agreement data without exception |
| AC-3 | Given a person **not** designated as signer, then their options are: approve, or request modification — no e-signature option; approval automatically advances to the next person in the sequence |
| AC-4 | Given a person **designated as signer**, then their options are: e-sign and approve, or request modification; their e-signature is attached to the agreement document upon approval |
| AC-5 | The signed agreement is automatically sent to the applicant only once **both** conditions are met: every person in the sequence has fully approved/reviewed (AC-3), **and** the designated e-signature(s) have been attached (AC-4) — the e-signature alone is not sufficient if other people in the sequence haven't yet completed their step *(BR-0213, clarified)* |
| AC-6 | There is no "reject" option anywhere in this sequence for any person — the application is already finally approved via J-09; the only alternative to approval/signing is a modification request (F4) |

**F4. Modification Request**
Description: Any person in the sequence can request a modification instead of approving/signing, with a mandatory note visible to everyone.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Any person in the sequence may request a modification instead of approving or signing, with a mandatory note shown to everyone in the sequence — same pattern as J-09/F7 |
| AC-2 | The creator receives the note, corrects the agreement, and re-submits it |
| AC-3 | Given re-submission, then the sequence resumes from the same person who requested the modification, without affecting those who already completed their step |

---

### Business Rules (from BRD)

BR-0212 (agreement from approved template, auto-merge, creator defines sequence) · BR-0213 (auto-send to applicant upon completion — clarified to require both full sequence completion and e-signature)

### Clarified Rules — based on your input

1. The internal signing sequence reuses J-09's committee-formation mechanism exactly, but is a functionally distinct entity.
2. Designated e-signer(s) are explicitly set at formation time — not necessarily the last person in the sequence.
3. No rejection option exists in this sequence — approval is already settled via J-09; modification is the only alternative.
4. Non-designated people go through review/approval only, without an actual e-signature step.
5. The agreement is only sent to the applicant once the full sequence AND the e-signature are both complete — signature alone does not trigger sending.

---

### Open items — pending

1. **Editable fields matrix** — pending upload.
2. **Number of designated signers** — can there be more than one per sequence, or always exactly one?