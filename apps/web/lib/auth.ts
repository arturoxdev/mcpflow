import { auth } from "@clerk/nextjs/server"
import { apiKeyService, API_KEY_PREFIX } from "@repo/core"

export type AuthResult = { userId: string } | null

export async function getAuth(request: Request): Promise<AuthResult> {
  const session = await auth()
  if (session.userId) {
    return { userId: session.userId }
  }

  const header = request.headers.get("authorization")
  if (!header) return null

  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  const token = match[1].trim()

  if (!token.startsWith(API_KEY_PREFIX)) return null

  return apiKeyService.findByToken(token)
}
