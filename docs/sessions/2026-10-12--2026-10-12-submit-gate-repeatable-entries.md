# Application submission blocked for everyone — the submit gate ignored `entries`

## Resume here

| | |
|---|---|
| **Branch** | `claude/dazzling-sagan-8lkpe3` (from `6e6ca21`) |
| **Head** | the fix commit on that branch, pushed |
| **Release tag** | none; latest is `expert-hub-v1.3.0` |
| **Deployed** | nothing from this session. The testing server still rejects every submission |
| **Backend validation** | ⚠️ **NOT RUN.** This cloud container has no .NET SDK, and the network policy refuses `builds.dotnet.microsoft.com`. The fix and its test have never been compiled |
| **Frontend validation** | not run. No frontend file changed |
| **Next thing to do** | On a machine with the SDK and LocalDB: `dotnet build` + `dotnet test` from `backend/`, then deploy |

**Reading order:** this record → `CHANGELOG.md` *Unreleased* →
`ApplicationFormLogic.cs` (`NormalizeEntries`, the four-argument
`MissingOrInvalidFields`).

## What was asked

1. A screenshot of the review step showing «تعذّر تقديم الطلب — حدث خطأ أثناء تقديم طلبك…», with: *"do debug on this Why the application submission is blocked even for the registered users"*.

## What was found and fixed

**Root cause.** Since form version `dm-gap-01.2026-09-21`, the education,
certifications and experience sections are repeatable. `NewApplicationPage`
sends their answers only in `entries[sectionId][i].values`.
`POST v1/me/applications/submit` ran `BR-0105` with
`MissingOrInvalidFields(fields, services, values)` over **every** field,
repeatable ones included, against the **flat** `values`. So every required
education or experience field read as empty, and the endpoint answered
`400 Application is incomplete.` The page shows that as the generic
`submitFailed` alert, and it drops `fieldErrors`. This affects every applicant,
registered or not.

**Why the suite stayed green.** The existing submit test
(`Submission_enforces_completeness…`) sends every field flat, which the server
reads as the legacy single-entry shape. No test sent the shape the browser
actually sends.

**Second blocker, same gate.** `professional-certificate`
(`perEntryOf: certifications`, `minEntries: 0`) was required for every
service, even from an applicant who listed no certificate. The client only
requires it per existing entry.

**The fix.** The server now mirrors `normalizeEntries` + `validateCompleteness`:

- Repeatable fields are judged per entry and keyed `entryId::fieldId`.
- An absent section is built from the flat values (the legacy shape) and then
  padded up to `minEntries`.
- A per-entry rule applies only when its section has an entry.

Regression test:
`A_submission_in_the_forms_own_shape_judges_repeatable_sections_per_entry`.

## Verbal rulings

none

## Corrections

none in this session. The file header comment in `ApplicationEndpoints.cs`
(G26: "no upload endpoint exists") is stale. The upload endpoint exists. That
comment was not changed.

## Where it stands / open items (technical)

- **Unverified build.** See *Resume here*.
- **`APPLICATION_ATTACHMENT` has no `EntryId`.** The upload endpoint ignores the
  `entryId` the form sends, and counts `MaxCount` across the whole application.
  If `qualification-certificate` has `maxCount: 1`, the second qualification's
  file upload is refused with `422 count`. This needs checking. It needs a
  migration to fix properly.
- **The page swallows the server's reason.** `handleConfirmSubmit` ignores
  `fieldErrors` and `missingAttachmentRuleIds`, so this bug was invisible. A
  small follow-up: map them onto the step errors.

## Resuming

```bash
cd backend && dotnet build && dotnet test --filter "FullyQualifiedName~ApplicationTests"
```

Environment trap: cloud sessions cannot install the .NET SDK (proxy 403).
Backend validation must run on a developer machine.
