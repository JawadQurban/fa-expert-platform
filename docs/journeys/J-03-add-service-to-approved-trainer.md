# Journey J-03 — Add Service to Approved Trainer

**Journey Name (AR):** إضافة خدمة لمدرب معتمد

---

## Journey Scope

Covers the trainer-initiated request to add a new service, the direct administrative decision on it, and the mandatory addendum upload that must happen before the decision can be finalized as approved. Ends once the addendum is live and reflected everywhere the trainer's agreement/services are shown, and the trainer is notified.

---

## Interface

Trainer Portal (request submission) → Internal Dashboard (review, decision, addendum upload)

---

## User Flow

1. An approved trainer opens their portal and requests to add a new service from within their profile
2. They select one or more services not already approved for them
3. Only mandatory fields specific to the new service, missing from their existing profile, are requested
4. On submission, a reference number is issued and the request is routed to an authorized decision-maker, shown alongside the trainer's full approved profile
5. The decision-maker reviews the request against the trainer's profile
6. If rejecting, a reason must be selected from the approved rejection reason list
7. If approving, the decision cannot be finalized until the decision-maker uploads the corresponding agreement addendum
8. Once the addendum is uploaded, the decision is finalized as approved, and the update reflects everywhere the trainer's services/agreement are shown
9. The trainer is notified of the outcome (approval, or rejection without the reason)

---

## Key Features & Functionality

## **F1. Additional Service Request Submission**

Description: An approved trainer requests a new service from their existing portal, without repeating the full onboarding application.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a trainer already approved for one or more services, when they open "add service," then the selection list only shows services not already approved for them — previously approved services are excluded *(BR-0110)* |
| AC-2 | Given a new service is selected, then only the mandatory fields specific to that service, missing from the trainer's existing profile, are requested — no re-entry of already-held data *(BR-0111)* |
| AC-3 | Given the request is submitted, then a reference number is generated and linked to it |

## **F2. Request Review with Trainer Context**

Description: The decision-maker reviews the new request alongside the trainer's full approved profile — not the request in isolation — to make an informed decision.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a service-addition request is submitted, then the decision-maker can view it together with the trainer's full approved profile: current services, specializations, classification, evaluations, and active agreement |
| AC-2 | Given multiple requests exist, then the decision-maker can search/filter them (by trainer name, requested service, status) |

## **F3. Direct Administrative Decision**

Description: The request skips screening and interview entirely, going straight to a single administrative accept/reject decision; approval is not finalized until the decision-maker uploads the agreement addendum, after which the update reflects everywhere the trainer's agreement/services are shown and the trainer is notified.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a submitted service-addition request, then it routes directly to an authorized decision-maker — no screening or interview stage is triggered *(BR-0112)* |
| AC-2 | Given the decision-maker reviews the request, then they can approve or reject it |
| AC-3 | Given the decision is "reject," then it cannot be completed without selecting a reason from the approved rejection reason list (or free text under "Other") *(BR-0112)* |
| AC-4 | Given the decision-maker selects "approve," then the decision cannot be finalized until they upload the corresponding addendum to the trainer's existing agreement — no new agreement is created, no additional e-signature required *(BR-0305)* |
| AC-5 | Given the addendum is uploaded, then the decision is finalized as approved, and the update reflects everywhere the trainer's services/agreement are shown (trainer profile, portal, any other consuming view) |
| AC-6 | Given the addendum is live, then the trainer is notified of the approval and the updated addendum |
| AC-7 | Given the request is rejected, then the trainer is notified of the outcome — without the rejection reason |

---

### Open items

1. Decision-maker role (Staff vs Manager) — not yet resolved.
2. Rejection reason list — shared with CAP-02 or separate — not yet resolved.
3. Re-request after rejection — cooldown or unrestricted — not specified in BRD.