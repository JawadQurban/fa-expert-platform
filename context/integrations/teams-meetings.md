# Teams meetings — interview booking (J-06/F2)

**Function:** How an interview gets a Teams link.

## Setup / connection

- `TeamsMeetingProvider`
  (`backend/src/ExpertHub.Infrastructure/Meetings/`) over Microsoft
  Graph, a singleton `HttpClient` with `PooledConnectionLifetime` and a
  `Teams:TimeoutSeconds` timeout (default 30 — a panel is waiting on it).
- Configuration: `Teams__TenantId`, `Teams__ClientId`, `Teams__ClientSecret`,
  `Teams__OrganizerUpn`, `Teams__TimeZone` (default `Arab Standard Time`),
  `Teams__InterviewMinutes` (default 30).
- **Empty `ClientSecret` ⇒ off.** The registration falls back to
  `NoMeetingProvider`, nothing is booked, and the interview panel behaves exactly
  as it did before — which is what `J-06` open item 1 has always meant.
- Note: this is **not** one of CAP-12's six registered systems
  (`IntegrationSystems`), so bookings do not flow through the outbox.

## Conventions

- `IsConfigured` is the only thing a caller asks; an unconfigured provider is a
  null object, never a half-built client.
- Booking failures log and return null. No interview state depends on a link
  existing.
- `MeetingBooking` carries the join URL and the Graph event id, so a reschedule
  updates the same event instead of creating a second one.

## Gotchas

- ⚠️ **`Calendars.ReadWrite` (Application) reaches every mailbox in the tenant**
  unless an Exchange administrator scopes it to the organiser with
  `New-ApplicationAccessPolicy`. Do not enable this integration before that
  policy exists.
- The token cache writes its value and its expiry as two separate fields, so
  concurrent bookings at the expiry boundary can each fetch a token. Harmless
  today; swap them for one immutable pair if it ever matters.
- Interview times are stored UTC. `Teams__TimeZone` affects only what the
  calendar invitation displays.
