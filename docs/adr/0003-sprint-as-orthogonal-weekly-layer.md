# Sprint is a weekly scheduling layer orthogonal to Boards

A **Sprint** is a planning container scoped to a single ISO week, identified by `(user_id, start_date)` where `start_date` is always a Monday (unique constraint). Tasks are *not* moved into a Sprint and they are not duplicated; instead, each Task gains three optional fields — `sprint_id`, `sprint_day` (enum `mon`..`sun`), and `sprint_position` (int) — set or cleared atomically together via a CHECK constraint. The Task continues to live in its Board and its Column, while membership in a Sprint is a *second dimension* (planning) that does not alter the Task's state of work. Closed Tasks remain in their Sprint Day rendered as completed (closedness derived via JOIN with `columns.is_closed`, never duplicated). Sprints span Boards: a single Sprint can hold Tasks from several Boards.

## Considered Options

- **Sprint absorbs the Task** (Task moves out of its Board into the Sprint while scheduled): rejected. Breaks the invariant "a Task belongs to exactly one Board and one Column", duplicates state ("am I in Doing or in Tuesday?"), and forces every Board view to know about Sprint visibility rules.
- **Virtual Sprint via a `scheduled_for: date` column on Tasks** (no `sprints` table; "current Sprint" is a query over the Mon-Sun window): rejected. Loses the ability to name a Sprint, makes "create future Sprints I haven't populated yet" impossible (no row to point at), and turns Sprint-level operations like rollover and rename into ad-hoc query gymnastics.
- **N:M membership** (a Task can be in multiple Sprints simultaneously, via a `sprint_tasks` join table): rejected. Doesn't match a personal task-tracker mental model — a Task gets done once, in one moment. Recurrence, if ever needed, is a separate feature, not multiplicity of Sprint.
- **Free-form Sprint dates** (any start_date, no Monday constraint, no uniqueness per week): rejected. Makes "the current Sprint" ambiguous, allows two overlapping Sprints to compete for the same week, and breaks the trivial lookup `WHERE start_date = mondayOfThisWeek(clientTZ)` that the sidebar Semana view depends on.

## Consequences

- **Three Task fields move together.** `sprint_id`, `sprint_day`, `sprint_position` are all NULL or all NOT NULL — enforced by a CHECK constraint. Setting `sprint_id = NULL` (e.g. via `ON DELETE SET NULL` when a Sprint is deleted) requires the application layer to also null `sprint_day` and `sprint_position` in the same transaction; the FK alone won't do it.
- **Closedness is never duplicated on the Task.** The Sprint detail view JOINs with `columns.is_closed` to render completed Tasks visually. A Task moving from a Closed Column back to an Open one automatically reappears as pending in its Sprint Day.
- **Archived Boards inherit invisibility into Sprint views for free.** The same `archived_at IS NULL` JOIN that hides Tasks of archived Boards everywhere also hides them from any Sprint day list — no explicit cleanup, no Sprint-side flag.
- **Timezone is client-side.** `start_date` is `DATE` (no TZ). The client computes `mondayOfThisWeek` in its local TZ and sends it to the server. REST endpoints accept `?weekOf=YYYY-MM-DD` for AI agents that need explicit control.
- **One Sprint per ISO week per user is enforced at the DB level** by `UNIQUE (user_id, start_date)`. The UI's date picker disables weeks already occupied to avoid hitting the constraint.
- **Sprint deletion sets Tasks loose** (`ON DELETE SET NULL`), it does not cascade to Tasks. The plan can be discarded; the Tasks survive in their Boards.
- **Default Sprint name is computed**, not stored: `name VARCHAR(120) NULL` and the UI renders `Semana ${getISOWeek} · ${getISOWeekYear}` when null. User overrides go into `name`; clearing the override returns to computed default automatically.
