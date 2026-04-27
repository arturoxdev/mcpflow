// lib/mcp/tools/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export function registerTools(server: McpServer) {

  // LIST COLUMNS
  server.registerTool(
    'list_columns',
    {
      title: 'List Columns',
      description: 'Lista las columnas globales del usuario (aplican a todos sus boards), en orden de posición',
      inputSchema: {},
      outputSchema: {
        success: z.boolean(),
        columns: z.array(z.object({
          id: z.string(),
          name: z.string(),
          position: z.number(),
        })).optional(),
        error: z.string().optional(),
      }
    },
    async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/columns`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const columns = await response.json()
        const output = { success: true, columns }
        return {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output,
        }
      } catch (error) {
        const output = { success: false, error: String(error) }
        return {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output,
        }
      }
    }
  )

  // CREATE TASK
  server.registerTool(
    'create_task',
    {
      title: 'Create Task',
      description: 'Crea una nueva tarea en la primera columna del board (o en una columna específica)',
      inputSchema: {
        boardId: z.string().describe('ID del board'),
        title: z.string().max(120).describe('Título de la tarea (máx 120 caracteres)'),
        priority: z.enum(['low', 'medium', 'high']).describe('Prioridad de la tarea'),
        description: z.string().optional().describe('Descripción en markdown (opcional)'),
        columnId: z.string().optional().describe('ID de la columna destino (opcional, default = primera)'),
      },
      outputSchema: {
        success: z.boolean(),
        task: z.object({
          id: z.string(),
          title: z.string(),
          priority: z.string(),
          columnId: z.string(),
        }).optional(),
        error: z.string().optional()
      }
    },
    async ({ boardId, title, priority, description, columnId }) => {
      try {
        const response = await fetch(`${BASE_URL}/api/boards/${boardId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            priority,
            description: description || '',
            ...(columnId ? { columnId } : {}),
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const task = await response.json()
        const output = { success: true, task }

        return {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output
        }
      } catch (error) {
        const output = { success: false, error: String(error) }
        return {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output
        }
      }
    }
  )

  // MOVE TASK
  server.registerTool(
    'move_task',
    {
      title: 'Move Task',
      description: 'Mueve una tarea a otra columna del board',
      inputSchema: {
        boardId: z.string().describe('ID del board'),
        taskId: z.string().describe('ID de la tarea'),
        columnId: z.string().describe('ID de la columna destino'),
      },
      outputSchema: {
        success: z.boolean(),
        error: z.string().optional()
      }
    },
    async ({ boardId, taskId, columnId }) => {
      try {
        const response = await fetch(`${BASE_URL}/api/boards/${boardId}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columnId })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const output = { success: true }
        return {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output
        }
      } catch (error) {
        const output = { success: false, error: String(error) }
        return {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output
        }
      }
    }
  )

  // DELETE TASK
  server.registerTool(
    'delete_task',
    {
      title: 'Delete Task',
      description: 'Elimina una tarea de un board',
      inputSchema: {
        boardId: z.string().describe('ID del board'),
        taskId: z.string().describe('ID de la tarea')
      },
      outputSchema: {
        success: z.boolean(),
        error: z.string().optional()
      }
    },
    async ({ boardId, taskId }) => {
      try {
        const response = await fetch(`${BASE_URL}/api/boards/${boardId}/tasks/${taskId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const output = { success: true }
        return {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output
        }
      } catch (error) {
        const output = { success: false, error: String(error) }
        return {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output
        }
      }
    }
  )
}
