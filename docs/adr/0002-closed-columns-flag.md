# Identify Closed Columns by an explicit `isClosed` flag

The sidebar's per-Board number must answer "how many Tasks do I have left to bring this Board to zero?" — i.e. count Open Tasks only. Since Columns are user-configurable globally (renameable, reorderable, multi-language), we cannot identify the "closed" state by the Column's `name` (e.g. matching `'Done'`) without baking a fragile string convention into the domain. We added `columns.isClosed boolean NOT NULL DEFAULT false`, allowing **zero or many** Columns per user to be marked Closed; the open-count query joins on `columns.isClosed = false`. This keeps the categorical state ("Closed") decoupled from any specific Column instance ("Done"), supports multi-terminal flows out of the box (e.g. "Done" + "Cancelled"), and reflects the same level of user control we already give to Column name, color, and order.

## Considered Options

- **Match by name** (`LOWER(name) = 'done'` at query time): rejected. Breaks on rename, breaks for non-English users, and forces every consumer to know the magic string. The "simpler" path turns into per-locale lookup tables within months.
- **Match by position** (`position = MAX(position)`): rejected. Position correlates with terminality but does not cause it; reordering or appending an "Archivado" column silently breaks counters.
- **Enum `kind: 'open' | 'closed'`**: rejected for now. We have two values and no third in sight; a boolean is honest about that. If we later need to distinguish "completed" from "cancelled", we add a separate `closedReason` field rather than overloading `kind`.

## Consequences

- **Backfill is name-based but one-shot**, not a runtime convention: `UPDATE columns SET isClosed = true WHERE LOWER(name) = 'done'` runs once at migration time. After that, the source of truth is the flag, not the name. A user who later renames "Done" to "Hecho" keeps `isClosed = true` automatically.
- **The seed (`columnService.seedDefaults`) creates "Done" with `isClosed: true`**, so new users get correct counters without touching settings.
- **The open-count lives on the Board entity** (`Board.openTaskCount`), exposed via `/api/boards`. The sidebar drops its `/api/tasks` fetch entirely; total General is derived as `sum(byBoard)` because every Open Task belongs to exactly one Board.
- **Filter scope is intentionally narrow**: `isClosed` only excludes Tasks from open-work *counters*. Tasks in Closed Columns remain fully visible inside their Board, in `/general`, and to MCP tools. Visibility ≠ counting.
- **Future "categorize closed reasons" is additive**: add `closedReason` (or similar) without renaming or removing `isClosed`. The flag answers "does this Column take a Task out of active work?", which is a stable question.
