---
name: session-record
description: >
  Write or update a session record — the hand-off document that lets a future session (or a
  different person) pick the work back up without re-deriving anything. Use this when the user
  asks to save, record, archive or hand off a session ("احفظ الجلسة", "save this session",
  "write a handoff"), when a working session is ending, before a long break, or when a context
  window is about to be summarised. Also use it when a session made a decision that exists only
  in conversation, or corrected an earlier claim — both are things nothing else in a repository
  records, and both are lost the moment the transcript is gone.
---

# Session records

A session record is the hand-off. Its one job: **someone resuming this work
should not have to re-derive anything.**

It is deliberately *not* a changelog. Most repositories already record what
shipped and what was decided. A session record holds the four things that
survive nowhere else:

| | Why it is only here |
|---|---|
| **The narrative** | What was asked, in what order, and why the work went the way it did. Commits show the *what*, never the *why this order*. |
| **Verbal rulings** | Decisions the user made in conversation that shaped the code. Real constraints, written nowhere, gone when the transcript is. |
| **Corrections** | Claims made during the session that turned out to be wrong. **A future session that re-derives a wrong conclusion, because nobody wrote down that it was wrong, has wasted the correction.** |
| **Where it stopped** | The exact next action, including any unanswered question that blocks it. |

---

## Before writing

Gather facts from the repository, not from memory of the conversation:

```bash
git log --oneline --format="%h %ad %s" --date=short <start>..HEAD
git status --short
git rev-parse --abbrev-ref HEAD
git tag -l          # is there a release tag for this state?
```

Run the project's own validation and record the **real** numbers — test count,
build status. Never write a number you did not just see.

Then find where records live. In this repository: **`docs/sessions/`**.
Elsewhere, look for `docs/sessions/`, `docs/handoff/` or similar; if none
exists, create `docs/sessions/` with a `README.md` explaining the convention,
and say that you created it.

---

## Structure

Filename: `YYYY-MM-DD--YYYY-MM-DD-short-slug.md` (start date, end date, slug).

### 1. Resume here — first, always

A small table someone can act on without reading further: branch · head commit ·
release tag · what is deployed · test count and validation state · the headline
score or state · **the next thing to do**.

Then a one-line reading order: which two or three documents to open, in order.

If the whole product runs on mock data, or any other fact that would mislead
someone who skipped it — say it here, not in a footnote.

### 2. What was asked, in order

A numbered list of the user's actual requests. Quote them where the wording
mattered — especially in the user's own language. This is what reconstructs the
session's shape.

### 3. What shipped

Grouped by theme, not one line per commit. Cite commit hashes. Link the decision
range (`P-84`→`P-113`) rather than restating the decisions.

For each group, state the **technique or principle**, not just the feature — that
is what a future session needs in order to stay consistent.

### 4. Verbal rulings

A table: the ruling (quoted, in the original language) → what it changed. Include
standing rules the user set for how you work, not only product decisions.

### 5. Corrections — mandatory

Every claim you made during the session that turned out to be wrong, what
replaced it, and where the correction now lives.

**Do not skip this section because it is unflattering.** It is the highest-value
part of the document. If you genuinely made none, write "none" — do not omit the
heading, or the next session cannot tell the difference between *no corrections*
and *nobody checked*.

### 6. Where it stands

The honest current state. What is complete, what is not, and **what is waiting on
someone else rather than on work**. Distinguish those two clearly — "blocked" and
"not started" are different, and conflating them wastes the next session's time.

### 7. Open questions, by who can answer them

Group by *who unblocks it*: product owner rulings · documents needed · data
needed · technical/infrastructure. A flat list makes someone re-sort it.

### 8. Where it stopped

The last thing said, especially an **unanswered question**. State the case for
the proposed next step and name what blocks it. If the session ended mid-task,
say exactly what is half-done.

### 9. Resuming

The literal commands to get back to a working state. Plus any **environment
traps** discovered — flaky tests and the flag that avoids them, tooling that
fails on certain input, anything that cost time once and would cost it again.

---

## Rules

- **Record real numbers.** Run the validation. A stale test count is worse than
  none, because it will be trusted.
- **Never duplicate the changelog.** Link to it. If a section is only restating
  shipped features, cut it.
- **Quote the user in their own language.** A ruling paraphrased into English
  loses the thing that made it a ruling.
- **Update the index.** A record nobody can find is a record nobody reads — add
  the row to `sessions/README.md`.
- **Check the entry point.** Whatever file the repository tells a new session to
  read first must point at the sessions directory. If it does not, fix it and
  say so.
- **Write it as a document, not a log.** Prose where prose is clearer, tables
  where structure is clearer. Someone will read this cold, months later, without
  the conversation.

---

## Updating an existing record

If the session is a continuation, **update the existing record** rather than
adding a near-duplicate: refresh the *Resume here* block, append to *What
shipped*, and rewrite *Where it stopped*. Start a new record when the work
changes subject, not when the calendar changes date.
