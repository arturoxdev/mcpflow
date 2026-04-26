import { CreateTask, Task } from "./entities";
import { db, tasks } from "./db";
import { eq, and, max } from "drizzle-orm";
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
      status: task.status,
      boardId: task.boardId,
      userId: task.userId,
      pr,
    };

    const [inserted] = await db.insert(tasks).values(newTask).returning();
    return inserted;
  };

  getAll = async (boardId: string): Promise<Task[]> => {
    return db.select().from(tasks).where(eq(tasks.boardId, boardId));
  };

  getAllByUser = async (userId: string): Promise<Task[]> => {
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  };

  getById = async (id: string, boardId: string): Promise<Task | undefined> => {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.boardId, boardId)));

    return task;
  };

  update = async (id: string, boardId: string, task: CreateTask): Promise<Task> => {
    const [updated] = await db
      .update(tasks)
      .set({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
      })
      .where(and(eq(tasks.id, id), eq(tasks.boardId, boardId)))
      .returning();

    if (!updated) {
      throw new Error('Task not found');
    }

    return updated;
  };

  delete = async (id: string, boardId: string): Promise<void> => {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.boardId, boardId)))
      .returning();

    if (result.length === 0) {
      throw new Error('Task not found');
    }
  };
}

export const taskService = new TaskService();
export default taskService;
