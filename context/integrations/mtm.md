# MTM — INT-02, trainer survey ratings

**Function:** Where trainer ratings are meant to come from, and what exists today.

## Setup / connection

- Registered as system `INT-02` in CAP-12's registry (`IntegrationSystems.Mtm`,
  seeded by `IntegrationSeedData`) — survey data hosted in the IMS estate
  (`P-13`).
- **No client, reader or channel exists.** Nothing in
  `backend/src/` calls MTM.

## Conventions

- The model is ready for it: `RATING_SOURCE_RECORD` holds a rating as the source
  system reported it, and `TRAINER_RATING` is the aggregate the trainer base and
  the matching engine read. `MasterSides`/`OwningSystems` mark MTM as the owner
  of what it reports.
- Ratings therefore influence matching only through those tables — never read a
  survey figure directly into a decision.

## Gotchas

- **Nothing writes `RATING_SOURCE_RECORD` or `TRAINER_RATING` outside seed data
  today.** A rating shown in the UI is seeded or absent, so do not read "no
  rating" as "poorly rated", and do not build a feature that assumes the ratings
  are live.
- When MTM is connected it joins as a CAP-12 system like any other: a channel, the
  outbox, `INTEGRATION_LOG`, and `REPLICATION_STATE` for drift.
