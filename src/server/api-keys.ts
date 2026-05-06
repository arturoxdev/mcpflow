import { createHash, randomBytes } from 'node:crypto'
import { and, eq, desc } from 'drizzle-orm'
import { ulid } from 'ulid'

import { db, apiKeys } from './db'
import { ApiKey } from './entities'

export const API_KEY_PREFIX = 'zb_pat_'

const hash = (raw: string): string =>
  createHash('sha256').update(raw).digest('hex')

const toEntity = (row: typeof apiKeys.$inferSelect): ApiKey => ({
  id: row.id,
  userId: row.userId,
  name: row.name,
  prefix: row.prefix,
  lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
  createdAt: row.createdAt.toISOString(),
})

class ApiKeyService {
  create = async (
    userId: string,
    name: string
  ): Promise<{ apiKey: ApiKey; plainToken: string }> => {
    const random = randomBytes(24).toString('hex')
    const plainToken = `${API_KEY_PREFIX}${random}`
    const prefix = plainToken.slice(0, 14)
    const hashedKey = hash(plainToken)

    const [inserted] = await db
      .insert(apiKeys)
      .values({
        id: ulid(),
        userId,
        name,
        prefix,
        hashedKey,
      })
      .returning()

    return { apiKey: toEntity(inserted), plainToken }
  }

  list = async (userId: string): Promise<ApiKey[]> => {
    const rows = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt))
    return rows.map(toEntity)
  }

  revoke = async (id: string, userId: string): Promise<void> => {
    const result = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .returning()
    if (result.length === 0) {
      throw new Error('API key not found')
    }
  }

  findByToken = async (
    plainToken: string
  ): Promise<{ userId: string } | null> => {
    if (!plainToken.startsWith(API_KEY_PREFIX)) return null
    const hashedKey = hash(plainToken)
    const [row] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.hashedKey, hashedKey))
    if (!row) return null

    // fire-and-forget last-used update; don't block the request
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, row.id))
      .catch(() => {})

    return { userId: row.userId }
  }
}

export const apiKeyService = new ApiKeyService()
export default apiKeyService
