# Email — INT-04, the notification gateway

**Function:** How Expert Hub sends what CAP-07 raises.

## Setup / connection

- `IEmailGateway` (`backend/src/ExpertHub.Infrastructure/Notifications/`).
  The registered default is **`NullEmailGateway`**: nothing is sent, and every
  send is recorded as pending in `NOTIFICATION_LOG`.
- `NotificationEmailChannel` is the CAP-12 channel for INT-04; the outbox
  publisher delivers through it once a real gateway is registered.
- Infrastructure has not supplied gateway details yet, so turning this on means
  one DI registration and no change to any capability.

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

- Nothing is actually delivered today. A screen that says "notified" means the
  event was raised and logged — check `NOTIFICATION_LOG.status` before concluding
  a person was told.
- The SLA deadlines that drive reminders are read from `SLA_MATRIX`, never
  restated in code (`BR-0705`).
