import { db, sprints, tasks, boards, columns } from "./db";
import { CreateSprint, Sprint, Task, UpdateSprint } from "./entities";
import { and, asc, desc, eq, isNull, lt } from "drizzle-orm";
import { ulid } from "ulid";

export class SprintWeekTakenError extends Error {
  constructor() {
    super("SPRINT_WEEK_TAKEN");
    this.name = "SprintWeekTakenError";
  }
}

export class SprintStartDateNotMondayError extends Error {
  constructor() {
    super("SPRINT_START_DATE_NOT_MONDAY");
    this.name = "SprintStartDateNotMondayError";
  }
}

const isMonday = (yyyyMmDd: string): boolean => {
  // Build a Date in UTC to avoid TZ ambiguity. JS getUTCDay: 0=Sun..6=Sat.
  const d = new Date(`${yyyyMmDd}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.getUTCDay() === 1;
};

const TASK_SELECT = {
  id: tasks.id,
  userId: tasks.userId,
  title: tasks.title,
  description: tasks.description,
  priority: tasks.priority,
  columnId: tasks.columnId,
  source: tasks.source,
  createdBy: tasks.createdBy,
  boardId: tasks.boardId,
  pr: tasks.pr,
  sprintId: tasks.sprintId,
  sprintDay: tasks.sprintDay,
  sprintPosition: tasks.sprintPosition,
} as const;

class SprintService {
  private serialize = (row: typeof sprints.$inferSelect): Sprint => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  });

  list = async (userId: string): Promise<Sprint[]> => {
    const rows = await db
      .select()
      .from(sprints)
      .where(eq(sprints.userId, userId))
      .orderBy(desc(sprints.startDate));
    return rows.map(this.serialize);
  };

  getById = async (id: string, userId: string): Promise<Sprint | undefined> => {
    const [row] = await db
      .select()
      .from(sprints)
      .where(and(eq(sprints.id, id), eq(sprints.userId, userId)));
    return row ? this.serialize(row) : undefined;
  };

  getByStartDate = async (
    startDate: string,
    userId: string
  ): Promise<Sprint | undefined> => {
    const [row] = await db
      .select()
      .from(sprints)
      .where(and(eq(sprints.startDate, startDate), eq(sprints.userId, userId)));
    return row ? this.serialize(row) : undefined;
  };

  // Tasks of a given Sprint, joined with active Boards. Closed Tasks remain
  // visible (their closedness is derived in the UI from columns.isClosed).
  getTasks = async (sprintId: string, userId: string): Promise<Task[]> => {
    return db
      .select(TASK_SELECT)
      .from(tasks)
      .innerJoin(boards, eq(tasks.boardId, boards.id))
      .where(
        and(
          eq(tasks.sprintId, sprintId),
          eq(tasks.userId, userId),
          isNull(boards.archivedAt)
        )
      )
      .orderBy(asc(tasks.sprintDay), asc(tasks.sprintPosition));
  };

  create = async (userId: string, input: CreateSprint): Promise<Sprint> => {
    if (!isMonday(input.startDate)) throw new SprintStartDateNotMondayError();

    const existing = await this.getByStartDate(input.startDate, userId);
    if (existing) throw new SprintWeekTakenError();

    const [inserted] = await db
      .insert(sprints)
      .values({
        id: ulid(),
        userId,
        startDate: input.startDate,
        name: input.name ?? null,
      })
      .returning();
    return this.serialize(inserted);
  };

  update = async (
    id: string,
    userId: string,
    patch: UpdateSprint
  ): Promise<Sprint> => {
    const setPayload: Record<string, unknown> = {};
    if (patch.name !== undefined) {
      // Allow clearing the override (name = null returns to computed default).
      setPayload.name = patch.name;
    }

    if (Object.keys(setPayload).length === 0) {
      const current = await this.getById(id, userId);
      if (!current) throw new Error("Sprint not found");
      return current;
    }

    const [updated] = await db
      .update(sprints)
      .set(setPayload)
      .where(and(eq(sprints.id, id), eq(sprints.userId, userId)))
      .returning();
    if (!updated) throw new Error("Sprint not found");
    return this.serialize(updated);
  };

  // ON DELETE SET NULL on the FK only nulls sprint_id; nullify the other two
  // sprint_* fields first so the CHECK invariant holds throughout the operation.
  delete = async (id: string, userId: string): Promise<void> => {
    await db.transaction(async (tx) => {
      await tx
        .update(tasks)
        .set({ sprintId: null, sprintDay: null, sprintPosition: null })
        .where(and(eq(tasks.sprintId, id), eq(tasks.userId, userId)));

      const result = await tx
        .delete(sprints)
        .where(and(eq(sprints.id, id), eq(sprints.userId, userId)))
        .returning();
      if (result.length === 0) throw new Error("Sprint not found");
    });
  };

  // Move all Open Tasks of the previous Sprint back into the pool (set sprint_*
  // to NULL on tasks whose column.isClosed = false). Returns count moved.
  rolloverFrom = async (
    previousSprintId: string,
    userId: string
  ): Promise<number> => {
    const previous = await this.getById(previousSprintId, userId);
    if (!previous) throw new Error("Sprint not found");

    const openTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .innerJoin(columns, eq(tasks.columnId, columns.id))
      .where(
        and(
          eq(tasks.sprintId, previousSprintId),
          eq(tasks.userId, userId),
          eq(columns.isClosed, false)
        )
      );

    if (openTasks.length === 0) return 0;

    const ids = openTasks.map((t) => t.id);
    for (const taskId of ids) {
      await db
        .update(tasks)
        .set({ sprintId: null, sprintDay: null, sprintPosition: null })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    }
    return ids.length;
  };

  // The most recent Sprint that started strictly before `startDate`.
  // Used by the "Pasar pendientes" rollover button.
  getPrevious = async (
    startDate: string,
    userId: string
  ): Promise<Sprint | undefined> => {
    const [prev] = await db
      .select()
      .from(sprints)
      .where(and(eq(sprints.userId, userId), lt(sprints.startDate, startDate)))
      .orderBy(desc(sprints.startDate))
      .limit(1);
    return prev ? this.serialize(prev) : undefined;
  };
}

export const sprintService = new SprintService();
export default sprintService;
