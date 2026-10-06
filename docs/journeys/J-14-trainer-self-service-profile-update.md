# Journey J-14 — Trainer Self-Service Profile Update

**Journey Name (AR):** التحديث الذاتي لملف المدرب

**Interface:** Trainer Portal

---

### Journey Scope

Covers the approved trainer updating their own personal, professional, and attachment data directly from their profile — without submitting a new application. Locked/system-managed fields remain read-only, updated only automatically by the system.

---

### User Flow

1. The trainer opens their profile from the Trainer Portal
2. They view all profile sections, using the same fields/sections as the original application form
3. They edit the fields available for self-update (personal data, professional data, certificates, attachments)
4. Locked fields (per the Locked Fields matrix below) appear read-only — not editable here
5. They save their updates, and the profile reflects the change immediately — no new application is submitted

---

## Supporting Matrix: Locked Fields on the Trainer Profile *(pending final confirmation)*

| # | Field |
| --- | --- |
| 1 | Classification |
| 2 | Evaluations |
| 3 | Contract/Agreement Status |
| — | *Pending additional fields* |

---

### Key Features & Functionality

**F1. Self-Service Data Update**
Description: The trainer updates their personal, professional, and attachment data using the same fields and sections as the original application form, without triggering a new application.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the trainer opens their profile, then editing uses the exact same fields/sections as the original application form — no separate update form is created *(BR-0404)* |
| AC-2 | Given the trainer edits personal data, professional data, certificates, or attachments, then these are the fields available for self-update *(US-0403)* |
| AC-3 | Given attachments are edited/re-uploaded, then the same Attachment Validation Rules established in J-01 apply (Image vs. Document categories, format/size limits) |
| AC-4 | Given the trainer saves their updates, then the profile reflects the changes immediately — no application resubmission or approval cycle is triggered |

**F2. Locked Field Protection**
Description: Fields listed in the Locked Fields matrix remain visible but non-editable to the trainer, updated only automatically by the system.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the trainer views their profile, then the fields listed in the Locked Fields matrix below appear as **read-only** — never editable by the trainer directly *(BR-0411)* |
| AC-2 | Given these locked fields, then they update automatically only from their system source — never through this journey |

---

### Business Rules (from BRD)

BR-0404 (self-update reuses the original application form's fields, no separate form) · BR-0411 (locked fields are read-only, auto-updated only from source)

---

### Open items — not assumed, flagging

1. **Re-verification trigger**: does editing certain fields (e.g., National ID-linked data) trigger re-verification through Identity Linking again, or is self-update entirely exempt from that logic once the trainer is already approved? Not specified in BRD.
2. **Update history/audit**: is there a visible change log for the trainer or staff to see what was self-updated and when? Not specified — likely covered generically by the platform-wide Audit Log (CAP-08), but worth confirming it applies here specifically.

Ready for J-15.