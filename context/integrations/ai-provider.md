# AI provider — INT-06, screening analysis

**Function:** The optional LLM analysis shown beside a screening, and the rules
that keep it out of the official decision.

## Setup / connection

- `LlmAiAnalysisProvider`
  (`backend/src/ExpertHub.Infrastructure/Screening/`), a singleton over
  one `HttpClient` with `PooledConnectionLifetime` and an `Ai:TimeoutSeconds`
  timeout (default 120 — it runs on the outbox, not a request).
- Configuration: `Ai__Provider`, `Ai__Model`, `Ai__ApiKey`, `Ai__Endpoint`,
  `Ai__MaxTokens`. **Without `Ai:ApiKey` and `Ai:Model` the provider reports
  itself unconfigured** and nothing is called.
- `AiAnalysisChannel` is the CAP-12 channel: the analysis request is queued on
  the outbox and written to `AI_ANALYSIS` when it returns.

## Conventions

- **The AI never scores.** `BR-0202`: the official screening score comes from the
  evaluation matrix. The analysis is an aid shown beside it, and the screening
  page simply shows no insight when there is none.
- The provider receives the applicant's answers and no identity.
- A provider fault is a failed delivery, so the outbox retries it; it never
  blocks or alters a screening.

- **The second crossing — the trainer bio (`P-331`).** `AiAnalysisChannel` hands
  every `TRAINER_BIO` message to `TrainerBioDrafting`, which reads the CV from the
  document store at send time (`CvText`: PDF, .docx, plain text), calls
  `IAiAnalysisProvider.DraftBioAsync`, and writes the draft only while the row is
  still `drafting` at the requested revision. It is the owner's explicit
  exception to `BR-0202`: the CV carries identity by nature, so the prompt tells
  the model to leave contact details out. The AI never publishes; the trainer
  submits and staff approve.

## Gotchas

- **Switched on by the owner on 2026-10-05** (`P-332`): Claude (`anthropic`,
  `claude-sonnet-5-5`) for every AI use case until the OpenAI account is funded,
  after which the switch is `EXPERT_HUB_AI_PROVIDER`/`_MODEL`/`_API_KEY` and a
  restart. `Q28` itself (the formal data-protection ruling) is still open; this
  is the owner's decision to proceed without waiting for it.
- A 429 or 5xx throws, so the outbox records a failed attempt and retries with
  backoff. Any other refusal (a wrong key, a bad request) returns null and is
  recorded as `unavailable`, because a retry would not change it.
