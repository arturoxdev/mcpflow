import { db, boards } from "./db";
import { Board } from "./entities";
import { and, eq } from "drizzle-orm";
import { ulid } from "ulid";

type BoardUpdate = {
  name?: string;
  description?: string;
  publicInboxEnabled?: boolean;
};

class BoardService {
  constructor() { }

  create = async (name: string, userId: string, description?: string): Promise<Board> => {
    const newBoard = {
      id: ulid(),
      name,
      description: description || '',
      createdAt: new Date(),
      userId,
    };

    const [inserted] = await db.insert(boards).values(newBoard).returning();

    return {
      ...inserted,
      createdAt: inserted.createdAt.toISOString(),
    };
  };

  getAll = async (userId: string): Promise<Board[]> => {
    const result = await db.select().from(boards).where(eq(boards.userId, userId));
    return result.map((board) => ({
      ...board,
      createdAt: board.createdAt.toISOString(),
    }));
  };

  getById = async (id: string, userId: string): Promise<Board | undefined> => {
    const [board] = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, id), eq(boards.userId, userId)));
    if (!board) {
      return undefined;
    }
    return {
      ...board,
      createdAt: board.createdAt.toISOString(),
    };
  };

  getByIdPublic = async (id: string): Promise<Board | undefined> => {
    const [board] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, id));
    if (!board) {
      return undefined;
    }
    return {
      ...board,
      createdAt: board.createdAt.toISOString(),
    };
  };

  update = async (id: string, userId: string, patch: BoardUpdate): Promise<Board> => {
    const setPayload: Record<string, unknown> = {};
    if (typeof patch.name === "string") setPayload.name = patch.name;
    if (typeof patch.description === "string") setPayload.description = patch.description;
    if (typeof patch.publicInboxEnabled === "boolean") setPayload.publicInboxEnabled = patch.publicInboxEnabled;

    if (Object.keys(setPayload).length === 0) {
      const current = await this.getById(id, userId);
      if (!current) throw new Error('Board not found');
      return current;
    }

    const [updated] = await db
      .update(boards)
      .set(setPayload)
      .where(and(eq(boards.id, id), eq(boards.userId, userId)))
      .returning();

    if (!updated) {
      throw new Error('Board not found');
    }

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    };
  };

  delete = async (id: string, userId: string): Promise<void> => {
    const result = await db
      .delete(boards)
      .where(and(eq(boards.id, id), eq(boards.userId, userId)))
      .returning();
    if (result.length === 0) {
      throw new Error('Board not found');
    }
  };
}

export const boardService = new BoardService();
export default boardService;
