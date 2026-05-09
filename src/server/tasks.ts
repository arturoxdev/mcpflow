import { CreateTask, ScheduleTask, SprintDay, Task, TaskWithBoard, UpdateTask } from "./entities";
import { db, tasks, boards, sprints, columns } from "./db";
import { eq, and, asc, max, isNull, count, sql } from "drizzle-orm";
import { ulid } from "ulid";

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
  effort: tasks.effort,
} as const;

class TaskService {
  constructor() { }

  private assertActiveBoard = async (boardId: string, userId: string): Promise<void> => {
    const [board] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.userId, userId), isNull(boards.archivedAt)));

    if (!board) {
      throw new Error('Board not found');
    }
  };

  private getNextPrNumber = async (boardId: string): Promise<number> => {
    const result = await db
      .select({ maxPr: max(tasks.pr) })
      .from(tasks)
      .where(eq(tasks.boardId, boardId));

    return (result[0]?.maxPr ?? 0) + 1;
  };

  create = async (task: CreateTask): Promise<Task> => {
    await this.assertActiveBoard(task.boardId, task.userId);
    const pr = await this.getNextPrNumber(task.boardId);

    const newTask = {
      id: ulid(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      columnId: task.columnId,
      source: task.source ?? ('internal' as const),
      createdBy: task.createdBy ?? null,
      boardId: task.boardId,
      userId: task.userId,
      pr,
      effort: task.effort ?? null,
    };

    const [inserted] = await db.insert(tasks).values(newTask).returning();
    return inserted;
  };

  getAll = async (boardId: string, userId: string): Promise<Task[]> => {
    return db
      .select(TASK_SELECT)
      .from(tasks)
      .innerJoin(boards, eq(tasks.boardId, boards.id))
      .where(and(eq(tasks.boardId, boardId), eq(tasks.userId, userId), isNull(boards.archivedAt)));
  };

  getAllByUser = async (userId: string): Promise<Task[]> => {
    return db
      .select(TASK_SELECT)
      .from(tasks)
      .innerJoin(boards, eq(tasks.boardId, boards.id))
      .where(and(eq(tasks.userId, userId), isNull(boards.archivedAt)));
  };

  getByColumn = async (
    columnId: string,
    userId: string
  ): Promise<TaskWithBoard[]> => {
    return db
      .select({
        ...TASK_SELECT,
        boardName: boards.name,
      })
      .from(tasks)
      .innerJoin(boards, eq(tasks.boardId, boards.id))
      .where(and(eq(tasks.columnId, columnId), eq(tasks.userId, userId), isNull(boards.archivedAt)))
      .orderBy(asc(tasks.boardId), asc(tasks.pr));
  };

  getById = async (
    id: string,
    boardId: string,
    userId: string
  ): Promise<Task | undefined> => {
    const [task] = await db
      .select(TASK_SELECT)
      .from(tasks)
      .innerJoin(boards, eq(tasks.boardId, boards.id))
      .where(
        and(
          eq(tasks.id, id),
          eq(tasks.boardId, boardId),
          eq(tasks.userId, userId),
          isNull(boards.archivedAt)
        )
      );

    return task;
  };

  update = async (
    id: string,
    boardId: string,
    userId: string,
    task: UpdateTask
  ): Promise<Task> => {
    await this.assertActiveBoard(boardId, userId);

    const [updated] = await db
      .update(tasks)
      .set({
        title: task.title,
        description: task.description,
        priority: task.priority,
        columnId: task.columnId,
        effort: task.effort,
      })
      .where(
        and(
          eq(tasks.id, id),
          eq(tasks.boardId, boardId),
          eq(tasks.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error('Task not found');
    }

    return updated;
  };

  delete = async (
    id: string,
    boardId: string,
    userId: string
  ): Promise<void> => {
    await this.assertActiveBoard(boardId, userId);

    const result = await db
      .delete(tasks)
      .where(
        and(
          eq(tasks.id, id),
          eq(tasks.boardId, boardId),
          eq(tasks.userId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new Error('Task not found');
    }
  };

  // Cross-board fetch (sprint scheduling shouldn't require knowing the boardId).
  getByIdAnyBoard = async (id: string, userId: string): Promise<Task | undefined> => {
    const [task] = await db
      .select(TASK_SELECT)
      .from(tasks)
      .innerJoin(boards, eq(tasks.boardId, boards.id))
      .where(
        and(eq(tasks.id, id), eq(tasks.userId, userId), isNull(boards.archivedAt))
      );
    return task;
  };

  // Pool of Open Tasks not in any Sprint, across active Boards.
  getPool = async (userId: string): Promise<TaskWithBoard[]> => {
    return db
      .select({ ...TASK_SELECT, boardName: boards.name })
      .from(tasks)
      .innerJoin(boards, eq(tasks.boardId, boards.id))
      .innerJoin(columns, eq(tasks.columnId, columns.id))
      .where(
        and(
          eq(tasks.userId, userId),
          isNull(boards.archivedAt),
          isNull(tasks.sprintId),
          eq(columns.isClosed, false)
        )
      )
      .orderBy(asc(boards.name), asc(tasks.pr));
  };

  // Schedule a Task into (or out of) a Sprint slot. Atomic by DB CHECK.
  schedule = async (
    id: string,
    userId: string,
    payload: ScheduleTask
  ): Promise<Task> => {
    const existing = await this.getByIdAnyBoard(id, userId);
    if (!existing) throw new Error('Task not found');

    if (payload.sprintId === null) {
      const [updated] = await db
        .update(tasks)
        .set({ sprintId: null, sprintDay: null, sprintPosition: null })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .returning(TASK_SELECT);
      if (!updated) throw new Error('Task not found');
      return updated;
    }

    const [sprint] = await db
      .select({ id: sprints.id })
      .from(sprints)
      .where(and(eq(sprints.id, payload.sprintId), eq(sprints.userId, userId)));
    if (!sprint) throw new Error('Sprint not found');

    let position: number;
    if (typeof payload.sprintPosition === 'number') {
      position = payload.sprintPosition;
      // Make room: shift existing tasks at >= position by +1 within the same day,
      // excluding the task being moved.
      await db
        .update(tasks)
        .set({ sprintPosition: sql`${tasks.sprintPosition} + 1` })
        .where(
          and(
            eq(tasks.sprintId, payload.sprintId),
            eq(tasks.sprintDay, payload.sprintDay),
            eq(tasks.userId, userId),
            sql`${tasks.sprintPosition} >= ${position}`,
            sql`${tasks.id} <> ${id}`
          )
        );
    } else {
      const [maxRow] = await db
        .select({ maxPos: max(tasks.sprintPosition) })
        .from(tasks)
        .where(
          and(
            eq(tasks.sprintId, payload.sprintId),
            eq(tasks.sprintDay, payload.sprintDay),
            eq(tasks.userId, userId)
          )
        );
      position = (maxRow?.maxPos ?? -1) + 1;
    }

    const [updated] = await db
      .update(tasks)
      .set({
        sprintId: payload.sprintId,
        sprintDay: payload.sprintDay,
        sprintPosition: position,
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning(TASK_SELECT);

    if (!updated) throw new Error('Task not found');
    return updated;
  };

  countOpenForSprintDay = async (
    sprintId: string,
    day: SprintDay,
    userId: string
  ): Promise<number> => {
    const [row] = await db
      .select({ value: count() })
      .from(tasks)
      .innerJoin(boards, eq(tasks.boardId, boards.id))
      .innerJoin(columns, eq(tasks.columnId, columns.id))
      .where(
        and(
          eq(tasks.userId, userId),
          isNull(boards.archivedAt),
          eq(tasks.sprintId, sprintId),
          eq(tasks.sprintDay, day),
          eq(columns.isClosed, false)
        )
      );
    return row?.value ?? 0;
  };
}

export const taskService = new TaskService();
export default taskService;
