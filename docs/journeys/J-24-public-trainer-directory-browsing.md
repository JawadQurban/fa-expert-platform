# Journey J-24 — Public Trainer Directory Browsing

**Journey Name (AR):** استعراض دليل المدربين العام

**Interface:** Public Interface

---

### Journey Scope

Covers a visitor browsing the public trainer directory of consenting trainers, filtering it by general specialization, and viewing each trainer's derived public profile. Begins once a visitor enters the trainer directory on the Public Interface. Ends with the selected trainer's public profile being displayed.

---

### User Flow

1. The visitor opens the trainer directory on the Public Interface
2. They browse consenting trainers, with the option to filter by general specialization
3. They open a specific trainer's profile and see their name, domain, specialization, and the programs they've delivered with the Academy

---

### Key Features & Functionality

**F1. Trainer Directory Browsing & Filtering**

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the directory, then it displays only trainers who have explicitly granted visibility consent (J-23) *(BR-1002)* |
| AC-2 | Given the directory, then the visitor can filter it by general specialization *(US-1002)* |

**F2. Public Trainer Profile Display**

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given a trainer's public profile, then it displays: name, domain, specialization, and programs delivered with the Academy — with no financial or sensitive personal data *(BR-1004, corrected)* |
| AC-2 | Given any later update to this data on the trainer's core profile, then it is automatically reflected on the public profile with no manual intervention *(BR-1005)* |

---

### Business Rules (from BRD, updated)

BR-1002 (no visibility without consent) · BR-1004 (corrected: name, domain, specialization, delivered programs — no free-text bio field, since none exists) · BR-1005 (automatic update)

---

### Open items

1. **Public evaluation display decision**: fully removed from this journey for now — needs a separate decision later if you want to add it.