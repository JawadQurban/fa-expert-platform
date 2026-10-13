# Email — INT-04, the notification gateway

**Function:** How Expert Hub sends what CAP-07 raises.

## Setup / connection

- `IEmailGateway` (`backend/src/ExpertHub.Infrastructure/Notifications/`).
  **`SmtpEmailGateway`** is registered when `Email:Host` and `Email:From` are
  set (`EXPERT_HUB_EMAIL_*` in the compose file, the password in
  `env/api.secrets.env` only); otherwise **`NullEmailGateway`**, and every send
  stays pending in the outbox.
- Settings: `Email:Host`, `Port` (25), `EnableSsl` (false), `Username`,
  `Password`, `From`, `FromName` (default «الأكاديمية المالية»),
  `TimeoutSeconds` (30).
- The testing server is **smtp4dev** — SMTP on `testingsmtp.fa.gov.sa:25`, no
  TLS; caught mail is readable at https://testingsmtp.fa.gov.sa/. Port 25 is
  not reachable from staff workstations, only from the server network.
- `NotificationEmailChannel` is the CAP-12 channel for INT-04; the outbox
  publisher delivers through it.

## Conventions

- **A capability never sends.** It raises an event code (`EV-xxxx`) through
  `NotificationDispatcher`, in the same `SaveChanges` as the business change.
  Whether that event reaches anyone is the matrix's decision
  (`NOTIFICATION_MATRIX`), not the caller's.
- `RaiseOnceAsync` with an idempotency key for anything a sweep can re-raise, so
  a reminder is sent once per threshold however often the job runs.
- Template text and recipients come from the database (`NOTIFICATION_TEMPLATE`,
  the matrix), never from code.
- One primary language per recipient, from their `preferred_communication_language`
  — not one bilingual message.
- `NOTIFICATION_LOG` and `NOTIFICATION_OCCURRENCE` are append-only: a failed send
  is followed up, never edited away.

## Gotchas

- A screen that says "notified" means the event was raised — check
  `NOTIFICATION_LOG.status` before concluding a person was told. With no SMTP
  settings nothing is delivered at all.
- The template is plain text; the gateway HTML-encodes it and wraps it in
  `dir="rtl"` (or `ltr` for English) so Arabic reads correctly in mail clients.
- The SLA deadlines that drive reminders are read from `SLA_MATRIX`, never
  restated in code (`BR-0705`).
