# Journey J-02 — Internal Nomination of New Applicant

**Journey Name (AR):** التسجيل الداخلي لمتقدم جديد

---

## Journey Scope

Covers staff-side data entry, identity matching, activation invitation, and the nominee's own account activation/verification. Ends once the nominee has portal access. Application progress through screening runs independently and in parallel — activation is not a gate for it. Downstream steps (interview, agreement, signing) proceed exactly as in the self-service path, performed by the nominee themselves from activation onward.

---

## **Interface:**

Internal Dashboard (staff entry) → Trainer Portal (from nominee activation onward)

---

## User Flow

1. Trainer Management Staff opens the internal registration form (same as self-service form)
2. Staff enters the nominee's basic data and selects one or more services
3. Sections 2–6 mandatory logic and field/attachment validation apply identically (F1 from J-01)
4. On save, Identity Linking runs automatically to match the nominee against an existing account
5. On staff submission, a reference number is issued immediately, and the application enters the screening queue (J-05) right away — not waiting for nominee activation
6. If no match is found, an "unverified" account is created immediately, linked to the application
7. An activation notification is sent to the nominee's email immediately (distinct template from self-submission confirmation)
8. Nominee opens the link → verifies their data (Nafath for citizen/resident, email for foreigner/Gulf) or logs into their matched account
9. From the moment activation succeeds, the nominee gets full Trainer Portal access — regardless of where their application currently stands in screening

---

## Key Features & Functionality

### **F1. Internal Nominee Registration**

Description: Staff enters the nominee's data using the identical application form and mandatory-by-service logic as J-01.

---

## Acceptance Criteria

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a staff member opens internal registration, then the same 6-section form, mandatory-by-service matrix, and validation rules from J-01/F1 apply without exception *(BR-0109)* |
| AC-2 | Given the staff member completes and submits the form, then a reference number is generated immediately and linked to the application, and the application enters the screening queue (J-05) right away — with no wait for nominee activation *(BR-0107)* |

### **F2. Identity Matching & Account Resolution**

Description: The same Identity Linking rules from J-01 apply, triggered by staff submission instead of applicant self-entry.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the nominee's identity data is entered, when the record is saved, then the platform checks for an existing matched account using the same Identity Linking rules as J-01 |
| AC-2 | Given a match is found, then the nomination links to that existing account (subject to the same edge cases: active Trainer role blocks, open application blocks, closed application allows) |
| AC-3 | Given no match is found, then an "unverified" account is created immediately, linked to the application, pending the nominee's own verification at activation |

### **F3. Activation Invitation**

Description: The system notifies the nominee that an application was submitted on their behalf, immediately upon staff submission.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the application is submitted by staff, then an activation notification is sent to the nominee's email immediately — not deferred to a later stage |
| AC-2 | Given this notification, then it uses a distinct template from the self-submission confirmation — *to be added to the Notification Matrix (J-26)* |

### **F4. Nominee Account Activation & Portal Access**

Description: The nominee verifies their own data or logs into their matched account, gaining full self-service access independent of the application's screening progress.

---

### Acceptance Criteria

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the nominee opens the activation link, when no matched account exists, then they verify their own data — via Nafath for citizen/resident, via email for foreigner/Gulf; successful verification activates the account |
| AC-2 | Given verification fails, then the same Nafath-failure handling from J-01 applies — a clear error blocks progress until the nominee corrects their own data |
| AC-3 | Given the nominee opens the activation link, when a matched account exists, then they log into that existing account instead of re-verifying |
| AC-4 | Given activation succeeds, then the nominee has full Trainer Portal access to track and act on their application independently — regardless of the application's current screening stage |

###