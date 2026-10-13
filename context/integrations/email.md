# Email — INT-04, the notification gateway

**Function:** How Expert Hub sends what CAP-07 raises.

## Setup / connection

- `IEmailGateway` (`backend/src/ExpertHub.Infrastructure/Notifications/`).
  **`NotificationsGatewayEmail`** — the Academy's **Notifications Gateway**,
  `POST /api/v1/Notifications/NotifyByEmail` with HTTP Basic — is registered
  when `Email:GatewayUrl`, `Email:Username` and `Email:Password` are all set
  (`EXPERT_HUB_EMAIL_*` in the compose file, the password in
  `env/api.secrets.env` only); otherwise **`NullEmailGateway`**, and every send
  stays pending in the outbox.
- Settings: `Email:GatewayUrl`, `Username`, `Password`, `FromName` (default
  «الأكاديمية المالية»), `TimeoutSeconds` (30).
- Testing gateway: https://testingnotifications.fa.gov.sa (Swagger at
  `/swagger/index.html`). Mail it delivers in testing is readable in smtp4dev
  at https://testingsmtp.fa.gov.sa/. Expert Hub never talks SMTP: port 25 is
  closed from FA-QIYAS.
- The same gateway also offers SMS (`NotifyBySms`) and OTP; neither is used.
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
