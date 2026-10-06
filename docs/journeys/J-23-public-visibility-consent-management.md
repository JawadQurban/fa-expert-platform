# Journey J-23 — Public Visibility Consent Management

**Journey Name (AR):** إدارة الظهور العام

**Interface:** Trainer Portal

---

### Journey Scope

Covers the trainer's control over their consent to appear in the public trainer directory — granting or withdrawing consent at any time. Begins once the trainer reaches "Approved" status (after J-13). Ends with their decision immediately reflected in whether their profile appears/disappears in the public interface (J-24).

---

### User Flow

1. The trainer opens their privacy/public visibility settings in their portal
2. They grant consent for their profile to appear in the public trainer directory, or withdraw it if previously granted
3. Upon withdrawal, their profile immediately disappears from the public directory — with no deletion of any data from their core profile

---

### Key Features & Functionality

**F1. Granting & Withdrawing Visibility Consent**
Description: The trainer has full, reversible control over their profile's appearance in the public directory.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the public trainer directory, then no trainer appears in it without their explicit, recorded consent *(BR-1002)* |
| AC-2 | Given the trainer's portal settings, then they can grant or withdraw consent at any time *(BR-1002)* |
| AC-3 | Given consent is withdrawn, then the profile immediately disappears from the public directory, with no deletion of any core Trainer Profile data (CAP-04) *(BR-1007)* |
| AC-4 | Given consent is granted again, then the profile immediately reappears in the directory |

---