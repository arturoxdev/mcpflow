import { CreateTask, Task, TaskWithBoard } from "./entities";
import { db, tasks, boards } from "./db";
import { eq, and, asc, max } from "drizzle-orm";
import { ulid } from "ulid";

class TaskService {
  constructor() { }

  private getNextPrNumber = async (boardId: string): Promise<number> => {
    const result = await db
      .select({ maxPr: max(tasks.pr) })
      .from(tasks)
      .where(eq(tasks.boardId, boardId));

    return (result[0]?.maxPr ?? 0) + 1;
  };

  create = async (task: CreateTask): Promise<Task> => {
    const pr = await this.getNextPrNumber(task.boardId);

    const newTask = {
      id: ulid(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      columnId: task.columnId,
      source: task.source ?? 'internal',
      createdBy: task.createdBy ?? null,
      boardId: task.boardId,
      userId: task.userId,
      pr,
    };

    const [inserted] = await db.insert(tasks).values(newTask).returning();
    return inserted;
  };

  getAll = async (boardId: string, userId: string): Promise<Task[]> => {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.boardId, boardId), eq(tasks.userId, userId)));
  };

  getAllByUser = async (userId: string): Promise<Task[]> => {
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  };

  getByColumn = async (
    columnId: string,
    userId: string
  ): Promise<TaskWithBoard[]> => {
    return db
      .select({
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
        boardName: boards.name,
      })
      .from(tasks)
      .innerJoin(boards, eq(tasks.boardId, boards.id))
      .where(and(eq(tasks.columnId, columnId), eq(tasks.userId, userId)))
      .orderBy(asc(tasks.boardId), asc(tasks.pr));
  };

  getById = async (
    id: string,
    boardId: string,
    userId: string
  ): Promise<Task | undefined> => {
    const [task] = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, id),
          eq(tasks.boardId, boardId),
          eq(tasks.userId, userId)
        )
      );

    return task;
  };

  update = async (
    id: string,
    boardId: string,
    userId: string,
    task: CreateTask
  ): Promise<Task> => {
    const [updated] = await db
      .update(tasks)
      .set({
        title: task.title,
        description: task.description,
        priority: task.priority,
        columnId: task.columnId,
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
}

export const taskService = new TaskService();
export default taskService;
