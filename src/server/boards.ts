import { db, boards, tasks, columns } from "./db";
import { Board } from "./entities";
import { and, count, eq, isNull } from "drizzle-orm";
import { ulid } from "ulid";
import { columnService } from "./columns";

type BoardUpdate = {
  name?: string;
  description?: string;
  publicInboxEnabled?: boolean;
};

class BoardService {
  constructor() { }

  private serialize = (
    board: typeof boards.$inferSelect,
    openTaskCount = 0
  ): Board => ({
    ...board,
    createdAt: board.createdAt.toISOString(),
    archivedAt: board.archivedAt?.toISOString() ?? null,
    openTaskCount,
  });

  create = async (name: string, userId: string, description?: string): Promise<Board> => {
    const newBoard = {
      id: ulid(),
      name,
      description: description || '',
      createdAt: new Date(),
      userId,
    };

    const [inserted] = await db.insert(boards).values(newBoard).returning();

    await columnService.ensureForUser(userId);

    return this.serialize(inserted);
  };

  getAll = async (userId: string): Promise<Board[]> => {
    const result = await db
      .select({
        id: boards.id,
        userId: boards.userId,
        name: boards.name,
        description: boards.description,
        publicInboxEnabled: boards.publicInboxEnabled,
        createdAt: boards.createdAt,
        archivedAt: boards.archivedAt,
        openTaskCount: count(columns.id),
      })
      .from(boards)
      .leftJoin(tasks, eq(tasks.boardId, boards.id))
      .leftJoin(
        columns,
        and(eq(columns.id, tasks.columnId), eq(columns.isClosed, false))
      )
      .where(and(eq(boards.userId, userId), isNull(boards.archivedAt)))
      .groupBy(boards.id);

    return result.map(({ openTaskCount, ...board }) =>
      this.serialize(board, openTaskCount)
    );
  };

  getById = async (id: string, userId: string): Promise<Board | undefined> => {
    const [board] = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, id), eq(boards.userId, userId), isNull(boards.archivedAt)));
    if (!board) {
      return undefined;
    }
    return this.serialize(board);
  };

  getByIdPublic = async (id: string): Promise<Board | undefined> => {
    const [board] = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, id), isNull(boards.archivedAt)));
    if (!board) {
      return undefined;
    }
    return this.serialize(board);
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
      .where(and(eq(boards.id, id), eq(boards.userId, userId), isNull(boards.archivedAt)))
      .returning();

    if (!updated) {
      throw new Error('Board not found');
    }

    return this.serialize(updated);
  };

  archive = async (id: string, userId: string): Promise<Board> => {
    const [updated] = await db
      .update(boards)
      .set({ archivedAt: new Date() })
      .where(and(eq(boards.id, id), eq(boards.userId, userId), isNull(boards.archivedAt)))
      .returning();

    if (updated) {
      return this.serialize(updated);
    }

    const [existing] = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, id), eq(boards.userId, userId)));

    if (!existing) {
      throw new Error('Board not found');
    }

    return this.serialize(existing);
  };

  delete = async (id: string, userId: string): Promise<void> => {
    const result = await db
      .delete(boards)
      .where(and(eq(boards.id, id), eq(boards.userId, userId), isNull(boards.archivedAt)))
      .returning();
    if (result.length === 0) {
      throw new Error('Board not found');
    }
  };
}

export const boardService = new BoardService();
export default boardService;
