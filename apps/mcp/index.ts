import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { boardService, columnService, taskService } from '@repo/core'
import { z } from "zod";
import type { Request, Response } from 'express';

const getServer = () => {

    const server = new McpServer({
        name: "zenmcp",
        version: "0.1.0",
    });

    server.registerTool(
        'list_boards',
        {
            title: 'List Boards',
            description: 'Lista todos los boards del usuario',
            inputSchema: {
                userId: z.string().describe('ID del usuario')
            }
        },
        async ({ userId }) => {
            try {
                const boards = await boardService.getAll(userId)

                const boardList = boards
                    .map((b: any) => `- ${b.name} (${b.id})`)
                    .join('\n')

                return {
                    content: [{
                        type: 'text',
                        text: boards.length
                            ? `📋 Boards:\n${boardList}`
                            : '📋 No hay boards'
                    }]
                }
            } catch (error) {
                return {
                    content: [{ type: 'text', text: `❌ Error: ${String(error)}` }]
                }
            }
        }
    )

    server.registerTool(
        'list_columns',
        {
            title: 'List Columns',
            description: 'Lista las columnas globales del usuario (aplican a todos sus boards), en orden de posición',
            inputSchema: {
                userId: z.string().describe('ID del usuario'),
            }
        },
        async ({ userId }) => {
            try {
                const columns = await columnService.ensureForUser(userId)
                const text = columns.length
                    ? `📊 Columnas del flujo:\n` +
                      columns.map((c) => `- ${c.name} (${c.id})`).join('\n')
                    : 'No hay columnas configuradas.'
                return { content: [{ type: 'text', text }] }
            } catch (error) {
                return {
                    content: [{ type: 'text', text: `❌ Error: ${String(error)}` }]
                }
            }
        }
    )

    server.registerTool(
        'list_tasks',
        {
            title: 'List Tasks',
            description: 'Lista todas las tareas de un board agrupadas por columna',
            inputSchema: {
                boardId: z.string().describe('ID del board'),
                userId: z.string().describe('ID del usuario'),
            }
        },
        async ({ boardId, userId }) => {
            try {
                const [tasks, columns] = await Promise.all([
                    taskService.getAll(boardId, userId),
                    columnService.ensureForUser(userId),
                ])

                const sections = columns.map((col) => {
                    const colTasks = tasks.filter((t: any) => t.columnId === col.id)
                    const formatted = colTasks.length
                        ? colTasks.map((t: any) => `  - [${t.priority}] ${t.title} (${t.id}) ${t.description}`).join('\n')
                        : '  (vacío)'
                    return `📌 ${col.name.toUpperCase()}:\n${formatted}`
                })

                const output = `📋 Tareas del board ${boardId}:\n\n${sections.join('\n\n')}`

                return {
                    content: [{ type: 'text', text: output }]
                }
            } catch (error) {
                return {
                    content: [{ type: 'text', text: `❌ Error: ${String(error)}` }]
                }
            }
        }
    )

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
                userId: z.string().describe('ID del usuario'),
                columnId: z.string().optional().describe('ID de la columna destino (opcional, default = primera)'),
            }
        },
        async ({ boardId, title, priority, description, userId, columnId }) => {
            try {
                let resolvedColumnId = columnId
                if (!resolvedColumnId) {
                    const userCols = await columnService.ensureForUser(userId)
                    const first = userCols[0]
                    if (!first) throw new Error('Sin columnas configuradas.')
                    resolvedColumnId = first.id
                }

                const task = await taskService.create({
                    title,
                    priority,
                    description: description || '',
                    columnId: resolvedColumnId,
                    boardId,
                    userId
                })
                return {
                    content: [{ type: 'text', text: `📋 Tarea ${task.id}: ${task.title}` }]
                }
            } catch (error) {
                return {
                    content: [{ type: 'text', text: `❌ Error: ${String(error)}` }]
                }
            }
        }
    )

    server.registerTool(
        'update_task',
        {
            title: 'Update Task',
            description: 'Update a task',
            inputSchema: {
                boardId: z.string().describe('ID del board'),
                taskId: z.string().describe('ID de la tarea'),
                userId: z.string().describe('ID del usuario'),
                title: z.string().max(120).describe('Título de la tarea (máx 120 caracteres)'),
                priority: z.enum(['low', 'medium', 'high']).describe('Prioridad de la tarea'),
                description: z.string().optional().describe('Descripción en markdown (opcional)')
            }
        },
        async ({ boardId, taskId, userId, title, priority, description }) => {
            try {
                const task = await taskService.getById(taskId, boardId, userId)

                if (!task) {
                    throw new Error('Tarea no encontrada')
                }

                task.title = title
                task.priority = priority
                task.description = description || ''
                await taskService.update(taskId, boardId, userId, task)

                return {
                    content: [{ type: 'text', text: `✅ Tarea actualizada: "${task.title}" (${task.id})` }]
                }
            } catch (error) {
                return {
                    content: [{ type: 'text', text: `❌ Error: ${String(error)}` }]
                }
            }
        }
    )

    server.registerTool('list_task_by_id', {
        title: 'List Task by ID',
        description: 'List a task by ID',
        inputSchema: {
            boardId: z.string().describe('ID del board'),
            taskId: z.string().describe('ID de la tarea'),
            userId: z.string().describe('ID del usuario'),
        }
    }, async ({ boardId, taskId, userId }) => {
        try {
            const task = await taskService.getById(taskId, boardId, userId)
            return {
                content: [{ type: 'text', text: `📋 Tarea ${taskId}: ${task?.title} ${task?.description}` }]
            }
        } catch (error) {
            return {
                content: [{ type: 'text', text: `❌ Error: ${String(error)}` }]
            }
        }
    })

    server.registerTool(
        'move_task',
        {
            title: 'Move Task',
            description: 'Mueve una tarea a otra columna del board',
            inputSchema: {
                boardId: z.string().describe('ID del board'),
                taskId: z.string().describe('ID de la tarea'),
                userId: z.string().describe('ID del usuario'),
                columnId: z.string().describe('ID de la columna destino'),
            }
        },
        async ({ boardId, taskId, userId, columnId }) => {
            try {
                const task = await taskService.getById(taskId, boardId, userId)
                if (!task) throw new Error('Tarea no encontrada')

                const column = await columnService.getById(columnId, userId)
                if (!column) throw new Error('Columna no encontrada')

                task.columnId = columnId
                await taskService.update(taskId, boardId, userId, task)

                return {
                    content: [{ type: 'text', text: `✅ Tarea ${taskId} movida a "${column.name}"` }]
                }
            } catch (error) {
                return {
                    content: [{ type: 'text', text: `❌ Error: ${String(error)}` }]
                }
            }
        }
    )

    server.registerTool(
        'delete_task',
        {
            title: 'Delete Task',
            description: 'Delete a task from a board',
            inputSchema: {
                boardId: z.string().describe('ID del board'),
                taskId: z.string().describe('ID de la tarea'),
                userId: z.string().describe('ID del usuario'),
            }
        },
        async ({ boardId, taskId, userId }) => {
            try {
                const task = await taskService.getById(taskId, boardId, userId)
                if (!task) throw new Error('Tarea no encontrada')

                await taskService.delete(taskId, boardId, userId)

                return {
                    content: [{ type: 'text', text: `✅ Tarea ${taskId} eliminada` }]
                }
            } catch (error) {
                return {
                    content: [{ type: 'text', text: `❌ Error: ${String(error)}` }]
                }
            }
        }
    )

    return server;
}

const app = createMcpExpressApp();

app.post('/mcp', async (req: Request, res: Response) => {
    const server = getServer();
    try {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        res.on('close', () => {
            console.log('Request closed');
            transport.close();
            server.close();
        });
    } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
});

app.get('/mcp', async (req: Request, res: Response) => {
    console.log('Received GET MCP request');
    res.writeHead(405).end(
        JSON.stringify({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.'
            },
            id: null
        })
    );
});

app.delete('/mcp', async (req: Request, res: Response) => {
    console.log('Received DELETE MCP request');
    res.writeHead(405).end(
        JSON.stringify({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.'
            },
            id: null
        })
    );
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
});

process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    process.exit(0);
});
