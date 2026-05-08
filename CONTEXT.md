# Zenboard

Zenboard is a personal task-board platform where users organize work into boards. AI agents (Cursor, Claude Code, custom scripts) collaborate via the REST API authenticated with personal access tokens (`zb_pat_*`). This document fixes the language we use across UI, code, and conversations.

## Language

**Board**:
The top-level container of work. A user owns many Boards, each with its own columns and tasks.
_Avoid_: project, tablero (used informally — never in code, docs, or copy).

**Archived Board**:
A Board with `archived_at` set. Invisible from every interface (boards list, `/general`, direct URL, public inbox URL, REST API). Not deleted: rows persist for recovery via direct DB intervention. The archive is **one-way** from the user's perspective — there is no "unarchive" UI.
_Avoid_: deleted board, hidden board.

**Task**:
A unit of work that lives inside exactly one Board and exactly one Column. Tasks of an Archived Board inherit invisibility — they are filtered everywhere by joining on the parent Board's `archived_at IS NULL`.
_Avoid_: card, ticket, item.

**Column**:
A status lane within a Board (e.g. "To do", "Doing", "Done"). Tasks belong to one Column at a time. Columns are user-configurable globally (see ZenBoard Flow settings). Each Column carries an `isClosed` flag — when `true`, Tasks in that Column are considered Closed and are excluded from open-work counters.
_Avoid_: lane, status, stage.

**Open Task**:
A Task whose Column has `isClosed = false`. The sidebar's per-Board number and the global "General" number count only Open Tasks — they answer "how many Tasks do I have left to bring this Board to zero?".
_Avoid_: pending task, active task, todo task.

**Closed Task**:
A Task whose Column has `isClosed = true`. Closed Tasks remain fully visible inside their Board (history matters) but do not contribute to open-work counters. A user can have multiple Closed Columns (e.g. "Done" and "Cancelled") — both contribute Closed Tasks.
_Avoid_: done task, finished task, completed task. ("Done" is the name of a Column instance, not the categorical state.)

**Public Inbox**:
A public, unauthenticated form at `/public/boards/{boardId}` where external clients can submit Tasks to a Board without logging in. Toggled per-Board via `publicInboxEnabled`. When the Board is archived, the public URL returns 404 even if `publicInboxEnabled` is still `true` (state is preserved, not mutated, so future restoration works).
_Avoid_: shared inbox, public form, share link.

**Sprint**:
A weekly planning container, identified by its `start_date` (always a Monday) and scoped to one User. **At most one Sprint per ISO week per user** (unique constraint on `(user_id, start_date)`). A Sprint does **not** own Tasks: a Task gains an optional `sprint_id` reference, orthogonal to its Board and Column. Membership in a Sprint is a *second dimension* (planning) — moving a Task to a Closed Column does not remove it from the Sprint; it stays in its Sprint Day, rendered as completed (state derived from the Column, not duplicated). Sprints span Boards: a single Sprint can hold Tasks belonging to several Boards.
_Avoid_: cycle, ciclo, semana de tareas, week-plan.

**Sprint Day**:
A specific day of the week (`mon`..`sun`) within a Sprint where a Task is scheduled. Stored on the Task as `sprint_day` (enum). Mandatory whenever `sprint_id` is set — there is no "Task in Sprint, no day yet" limbo. Stored as enum, not date, because Sprints are always Monday-to-Sunday and the day is purely a slot, not an absolute timestamp (timezone-free by construction).
_Avoid_: sprint slot, day-bucket, scheduled date.

## Relationships

- A **User** owns many **Boards** and many **Sprints**
- A **Board** contains many **Tasks** and references the user's **Columns**
- A **Task** belongs to exactly one **Board** and one **Column**, and optionally to one **Sprint** + one **Sprint Day**
- A **Column** is either Open (`isClosed = false`) or Closed (`isClosed = true`); a Task is **Open** or **Closed** by inheritance from its Column
- A **Sprint** holds zero-or-more **Tasks** scheduled to its days; a Task can be in at most one Sprint at a time. Tasks of an **Archived Board** disappear from any Sprint view via the same `archived_at IS NULL` JOIN — no explicit cleanup
- An **Archived Board** continues to own its **Tasks** in the DB; both become invisible together
- A **Public Inbox** belongs to one **Board** and is dormant when the Board is Archived

## Example dialogue

> **Dev:** "When the user archives a **Board**, do we also mark each **Task** as archived?"
> **Domain expert:** "No — the **Task**'s archived state is derived from its parent **Board**. There's a single `archived_at` on the Board; queries filter via JOIN. One source of truth."

> **Dev:** "If a client still has the **Public Inbox** link, can they keep submitting to an **Archived Board**?"
> **Domain expert:** "No, the URL returns 404 once the **Board** is archived. We don't flip `publicInboxEnabled` — the underlying state is preserved so an eventual restore brings the inbox back exactly as it was."

> **Dev:** "Can an AI agent see **Archived Boards** via the REST API?"
> **Domain expert:** "No. The filter lives in `src/server/`, so every consumer (UI pages, REST routes) loses visibility automatically."

## Flagged ambiguities

- **"proyecto" / "tablero" / "board"** were used interchangeably in conversation — resolved: the canonical term is **Board**. The other two are informal and never appear in code, API, or copy.
- **"archive" vs "soft delete"** — resolved: we say **archive**. Soft delete describes the storage mechanic (rows preserved); archive describes the user intent (project closed). The user-facing word is "Archivar".
- **"done" vs "closed"** — resolved: **Done** is the default *name* of a Column instance (created by the seed). **Closed** is the *categorical state* of any Column with `isClosed = true`. Multiple Columns can be Closed at once (e.g. "Done" + "Cancelled"); none being Closed is also valid (counters fall back to total). Identifying "the closed state" by Column name is explicitly rejected — see ADR.
- **"ticket" / "card" / "item"** — resolved: the canonical term is **Task**. The others appear in casual conversation but never in code, API, or copy.
