# Journey J-11 — Applicant Signing & Activation

[Arabic Version](ar/J-11-applicant-signing-and-activation.md)

**Journey Name (AR):** توقيع المتقدم وتفعيله

**Interface:** Trainer Portal

---

### Journey Scope

Begins once the fully internally-approved agreement is automatically sent to the applicant (from J-10). Covers the applicant locating the agreement in their portal and taking one of three decisions on it: e-sign (approve), reject, or request modification. Ends once the applicant signs — activating the agreement, generating the final signed PDF, and saving a copy in both the internal system and the trainer's own portal. Trainer profile creation itself is covered in a later journey (CAP-04).

---

### User Flow

1. The applicant receives the fully internally-signed agreement (per J-10) via notification
2. They find the agreement within "My Applications" in the Trainer Portal
3. They preview or download the full agreement before deciding
4. They take one of three decisions: e-sign and approve, reject, or request modification
5. On signing, their status automatically changes to "Approved," a final signed PDF is generated, and the agreement becomes active
6. On rejection, the application is permanently closed
7. On modification request, the note returns to the agreement's creator (from J-10), who edits and re-submits it through a brand-new internal signing sequence

---

### Key Features & Functionality

**F1. Applicant Decision on the Agreement**
Description: The applicant finds their fully internally-approved agreement within their portal and takes one of three decisions: e-sign (approve) in-platform, reject (permanently closing the application), or request modification (returning it to the creator).

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the agreement is fully internally signed (J-10), then the applicant can find it within "My Applications" in the Trainer Portal *(US-0215)* |
| AC-2 | Given the agreement, then the applicant can preview or fully download it before deciding — showing all agreement data without exception |
| AC-3 | Given the applicant chooses to sign, then they e-sign the agreement **within the platform** — using the same e-signature mechanism built in J-10 — and their status automatically changes to "Approved" |
| AC-4 | Given the applicant chooses to reject, then the application status is **permanently closed** — no return path or automatic re-submission from this point |
| AC-5 | Given the applicant chooses to request modification, then a note is written and returned to the application's creator (the person who prepared the agreement in J-10) |
| AC-6 | Given the creator receives the modification note, then they edit the agreement and re-submit it |
| AC-7 | Given the edited agreement is re-submitted, then it goes through a **brand-new internal signing sequence from scratch** (J-10) — not a resumption from a prior point, since the modification changed the agreement document itself |

**F2. Final Document Generation & Handoff**
Description: Once the applicant e-signs, a final signed PDF is generated automatically, the agreement becomes active under agreement lifecycle management, and a copy is saved in the trainer's own portal.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the applicant e-signs, then a final signed PDF is automatically generated (carrying all internal signatures plus the applicant's), and saved linked to the trainer's record *(BR-0221)* |
| AC-2 | Given signing is complete, then the agreement moves to CAP-03 (Agreement & Contract Management) as an active agreement *(BR-0214)* |
| AC-3 | Given the final signed agreement exists, then a copy is also saved within the **Agreements section of the trainer's own portal** — not kept only in the internal system; the trainer can access it from their profile at any time |

---

### Scope distinction — worth noting

This reintroduces reject/modify at the applicant's stage even though J-09/J-10 established "no rejection after final committee approval." This is not a contradiction: J-09/J-10 decisions are about the **person's eligibility** (already settled). J-11's reject/modify is the applicant's decision about the **contract terms themselves** (pricing, conditions, etc.) — seen in full for the first time only at this stage. Worth keeping this distinction explicit so the two rule sets aren't read as conflicting.

---

### Open items

1. **No-response SLA**: saved for later cleanup when building the full SLA matrix, per your direction.