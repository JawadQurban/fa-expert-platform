# The owner's answers to the UAT re-test questions: four built, BUG-007 still has no new list

## Resume here

| | |
|---|---|
| Branch | `cr/notion-2026-10-07`, pushed |
| Head | The commit carrying this record, on top of `1659722` |
| Release tag | none |
| Deployed | **No** |
| Validation | After `P-391`: backend full run 550 of 551, the one failure a missing agreement row in the new test; test fixed, then the Cap05 class **61/61**, build 0 warnings. Frontend unchanged since **1779/1779** |
| Migrations waiting for the server | M55, M56, M57, **M58** `ManualPickOverridesAndServiceRejectionNotice` |
| Notion | Not connected this session. **BUG-007 still reads Resolved = YES, which is wrong** until a new list arrives |
| Left out of the commits on purpose | `.skills/` (a nested repository), `docs/Bugs/` (the owner's working files), `diary/repo/2026-10-28.jawad-qurban.md` (maps production FAST account ids) |
| Next | The owner called both role endpoints from the server against FAST's testing environment: working. Still to see there: a real signature granting the role through the outbox |

Read in this order: this file → [the previous record](2026-10-28--2026-10-28-notion-uat-retest-bugs.md) → `docs/DECISIONS.md` `P-378`, `P-385`, `P-387`–`P-389`.

## What was asked, in order

1. Five answers to the previous session's questions, «start do the work» (quoted below).
2. «what is missing now from the bugs ?», asked while the validation was still running. The answer was given and the verification then finished.
3. «start push and commit», which also took the uncommitted set of `2026-10-28`.
4. On 2026-11-02, the deploy command and three more answers (next section). The double-booking answer changed code, so the deploy waits on that commit.
5. FAST's new `Trainer/GrantTrainerRole`: «add when the use get approved as trainer» (`P-391`), then «yes it should be revoke if the aggrement end», then push and give the command.

## What changed

Details are in `CHANGELOG.md` *[Unreleased] › Fixed*; the principles worth keeping:

- **City names are FAST's bytes** (`P-385`). `extract-reference-lists.py` no longer corrects anything. The English spellings looked like a harmless display fix, but `InPersonCities.ForMatching` compares both FAST names, so a corrected «Madinah» could miss FAST's «Maddenah». A test now pins that. The stored answer is `city-<id>`, so no saved draft changes.
- **An override is state, not a refusal** (`P-388`). `POOL_MEMBER.override_reasons` holds the rules a manual pick failed, and the approver sees them. `RulesFailedBy` is the one reading of those rules, shared by the named path, the search and the send.
- **The partial-rejection email follows E-012's shape** (`P-389`): `serviceList` plus `serviceList@en`, using the new `ApplicationServices.NameEn`.
- **The PDF is an off-screen A4 sheet** (`P-387`). The sheet mounts only while exporting and is the captured node, so the screen card never changes. The host is `position: fixed` and the captured sheet inside it is not, because `html-to-image` copies computed styles onto its clone. Pages break after any `data-pdf-block` element (rows and list items), so a heading stays with its row.

## Verbal rulings

| Ruling (as given) | What it changed |
|---|---|
| «Yes. The applicant should receive an email listing the rejected services.» | `EV-0218`, `E-078` (`P-389`) |
| «Yes. Staff can select any trainer manually, even if the trainer doesn't meet the matching criteria.» | `P-388`, superseding `P-378`'s "never offered" and the manual half of J-17/F3/AC-3 |
| «The city list must match the FAST list exactly, whatever that list contains, including any regions and the exact spelling of every name. Assignment requests come from FAST, so any difference between the two lists will break matching. Don't keep your spelling corrections unless FAST uses the same spelling.» | Corrections removed (`P-385`, M58) |
| «Yes. Use the latest list, on bugs folder i update new list» | **Could not be applied:** see *Corrections* |
| «keep the certification list as is» | BUG-007 closed with no change (`P-390`) |
| «trainer no» (should naming a trainer on a request override the rules?) | `nominee-not-eligible` stays (`P-390`) |
| «no it should not» (may a hand-picked trainer end up double-booked?) | The pick is refused with `409 schedule-conflict` and its checkbox is disabled (`P-388`) |
| «Switch to A4. A branded template will be provided later. For now, create a temporary template using the platform's design system.» | A4 sheet (`P-387`) |

## Calls made here that the owner did not rule on

- "Any trainer" includes one not accredited for the requested service: the literal reading of the ruling. They appear with the reason `not-accredited`.
- A trainer named on the request itself is still refused (`nominee-not-eligible`): that is the requester's choice, and the ruling is about staff.
- The engine's own run still excludes, and its excluded panel has no checkboxes; the route to those people is the manual search.
- The override reasons are recorded and shown to the approver, which was not asked for, because otherwise a suspended trainer would reach approval unflagged.
- The email lists services without reasons, as the ruling words it.
- Surrounding whitespace in FAST names («Tema », «Wadi Aldwaser ») is still trimmed. Matching ignores it.

## Corrections

- **"The new certification list is in `docs/Bugs`."** It is not new: `Certification_Master_List_Classified (2) (1) (1).xlsx` and `docs/inputs/certification-master-list.xlsx` have the same SHA-256 (`a6ba9f89…`). Likewise `docs/Bugs/Citys_and_countrys/country and city.xlsx` is the same file as `docs/inputs/fast-country-and-city.xlsx`.
- **The nine English city corrections (`2026-10-28`) were my mistake, not a display nicety.** They could break the matching they were meant to serve.
- **The first A4 page breaks cut through text.** Breaks fell only after whole rows, so a list taller than a page was sliced through a line. Unit tests could not see this; a real export did. Each list item is now a break point. The test card went from 5 pages to 4.
- **`--fads-ref-space-12` does not exist** (the scale stops at 9). I used it for the logo before checking; `--fads-ref-space-9` replaced it.
- **My first `pageSlices` test expected the wrong slices**; the code was right.
- **The table is `FAST_USER_PROFILE`, not `FAST_PROFILE_REPLICA`.** I gave the owner a server query with the wrong name, copied from `context/integrations/fast-api.md`, which is now corrected. The entity class is still `FastProfileReplica`.
- **One full backend run reported 2 failures** while the frontend suite ran beside it. Their names were lost to `tail`. The next run, alone, passed 546/546. Treat this as load-related but unidentified, not as proven flakes.

## Where it stands

**Done, validated, pushed, not deployed:** the partial-rejection email, BUG-039 override, BUG-005 names, BUG-051 A4.

**Checked in a real browser:** the A4 export only, through Chromium on a temporary harness card with no photo (1 page and 4 pages, 595.28×841.89 pt). The harness is deleted. The matching page and the email were checked by tests only.

**Waiting on someone else:**

| Item | Waiting on |
|---|---|
| BUG-051 final look | The owner: the branded template |
| BUG-016 foreign/GCC applicants | An identity route for non-Nafath applicants |
| BUG-050 in production | IT: Graph `OnlineMeetings.ReadWrite.All` + Teams application access policy |
| Everything reaching the testers | Deploy |

**Not done, and it is work:** the `attachmentId` backfill for BUG-042's older requests; `docs/schema.d2` was not regenerated for `override_reasons`.

## Open questions, by who can answer them

- **Owner:** the wording of `E-078`; whether accepting an offer should re-check for a booking made after the pool was sent (a gap on both paths, not built). Still open from before: `P-381`, the `P-382` ceilings, notes per service.
- **Documents/data:** an events list (BUG-004); whether FAST's `active` means «published on the site».
- **Technical:** deploy; Teams permission; `npm audit` on `react-router` (GHSA-qwww-vcr4-c8h2); Notion's BUG-007 row, which needs the connector authorized or a manual edit.

## Where it stopped

All code answers are committed and pushed and passed both suites before committing. Next: deploy. If a new certification list ever arrives, copy it over `docs/inputs/certification-master-list.xlsx`, run the generator, and check whether scoring tables changed, because `EvaluationLookupTables.cs` comes from the same workbook.

## Resuming

```bash
git checkout cr/notion-2026-10-07
cd backend && sqllocaldb start MSSQLLocalDB && dotnet build && dotnet test
cd ../frontend && npm install && npm run validate && npm run build
```

**Environment traps**

- `dotnet ef` needs `--startup-project src/ExpertHub.Infrastructure`, not `ExpertHub.Api`.
- `extract-reference-lists.py` rewrites all its outputs unformatted. Run Prettier on the `.ts` files, and `git checkout` the ones whose data did not change, or a one-list change becomes thousands of lines of diff.
- The full backend suite takes about 11 minutes and overruns the 10-minute tool limit, so run it in the background and keep the failing names (no `tail`).
- `npm run validate` stops at `format:check` without running tests. A grep for the test summary then shows nothing, which is not a pass.
- `timeout` is not available in Git Bash here. A heredoc with heavy Arabic and quoting failed to parse: write scripts to a file.
- The Read tool renders a PDF under 10 pages only without a `pages` argument; with one it needs `pdftoppm`, which is not installed.
