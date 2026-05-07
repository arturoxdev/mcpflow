import { db, columns, tasks } from "./db";
import { Column, CreateColumn, UpdateColumn } from "./entities";
import { and, asc, count, eq, max } from "drizzle-orm";
import { ulid } from "ulid";

export class ColumnHasTasksError extends Error {
  constructor() {
    super("COLUMN_HAS_TASKS");
    this.name = "ColumnHasTasksError";
  }
}

class ColumnService {
  list = async (userId: string): Promise<Column[]> => {
    const rows = await db
      .select()
      .from(columns)
      .where(eq(columns.userId, userId))
      .orderBy(asc(columns.position));

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
  };

  getById = async (id: string, userId: string): Promise<Column | undefined> => {
    const [row] = await db
      .select()
      .from(columns)
      .where(and(eq(columns.id, id), eq(columns.userId, userId)));
    if (!row) return undefined;
    return { ...row, createdAt: row.createdAt.toISOString() };
  };

  getFirst = async (userId: string): Promise<Column | undefined> => {
    const [row] = await db
      .select()
      .from(columns)
      .where(eq(columns.userId, userId))
      .orderBy(asc(columns.position))
      .limit(1);
    if (!row) return undefined;
    return { ...row, createdAt: row.createdAt.toISOString() };
  };

  create = async (userId: string, input: CreateColumn): Promise<Column> => {
    const [maxRow] = await db
      .select({ maxPos: max(columns.position) })
      .from(columns)
      .where(eq(columns.userId, userId));

    const nextPosition = (maxRow?.maxPos ?? -1) + 1;

    const [inserted] = await db
      .insert(columns)
      .values({
        id: ulid(),
        userId,
        name: input.name,
        color: input.color ?? "bg-muted",
        position: nextPosition,
        isClosed: input.isClosed ?? false,
      })
      .returning();

    return { ...inserted, createdAt: inserted.createdAt.toISOString() };
  };

  update = async (
    id: string,
    userId: string,
    patch: UpdateColumn
  ): Promise<Column> => {
    const setPayload: Record<string, unknown> = {};
    if (typeof patch.name === "string") setPayload.name = patch.name;
    if (typeof patch.color === "string") setPayload.color = patch.color;
    if (typeof patch.isClosed === "boolean") setPayload.isClosed = patch.isClosed;

    if (Object.keys(setPayload).length === 0) {
      const current = await this.getById(id, userId);
      if (!current) throw new Error("Column not found");
      return current;
    }

    const [updated] = await db
      .update(columns)
      .set(setPayload)
      .where(and(eq(columns.id, id), eq(columns.userId, userId)))
      .returning();

    if (!updated) throw new Error("Column not found");

    return { ...updated, createdAt: updated.createdAt.toISOString() };
  };

  reorder = async (userId: string, ids: string[]): Promise<Column[]> => {
    const existing = await this.list(userId);
    const existingIds = new Set(existing.map((c) => c.id));
    if (ids.length !== existing.length || !ids.every((id) => existingIds.has(id))) {
      throw new Error("Reorder ids do not match existing columns");
    }

    for (let i = 0; i < ids.length; i++) {
      await db
        .update(columns)
        .set({ position: i })
        .where(and(eq(columns.id, ids[i]!), eq(columns.userId, userId)));
    }

    return this.list(userId);
  };

  delete = async (id: string, userId: string): Promise<void> => {
    const [taskCount] = await db
      .select({ value: count() })
      .from(tasks)
      .where(eq(tasks.columnId, id));

    if ((taskCount?.value ?? 0) > 0) {
      throw new ColumnHasTasksError();
    }

    const result = await db
      .delete(columns)
      .where(and(eq(columns.id, id), eq(columns.userId, userId)))
      .returning();

    if (result.length === 0) throw new Error("Column not found");
  };

  countTasks = async (id: string): Promise<number> => {
    const [row] = await db
      .select({ value: count() })
      .from(tasks)
      .where(eq(tasks.columnId, id));
    return row?.value ?? 0;
  };

  seedDefaults = async (userId: string): Promise<Column[]> => {
    const existing = await this.list(userId);
    if (existing.length > 0) return existing;

    const defaults = [
      { name: "To Do", color: "bg-destructive", isClosed: false },
      { name: "Doing", color: "bg-chart-3", isClosed: false },
      { name: "Done", color: "bg-chart-4", isClosed: true },
    ];

    const rows = defaults.map((d, i) => ({
      id: ulid(),
      userId,
      name: d.name,
      color: d.color,
      position: i,
      isClosed: d.isClosed,
    }));

    const inserted = await db.insert(columns).values(rows).returning();
    return inserted.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  };

  ensureForUser = async (userId: string): Promise<Column[]> => {
    const existing = await this.list(userId);
    if (existing.length > 0) return existing;
    return this.seedDefaults(userId);
  };
}

export const columnService = new ColumnService();
export default columnService;
