import { z } from 'zod'

const BoardSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    description: z.string(),
    publicInboxEnabled: z.boolean(),
    createdAt: z.string(),
    archivedAt: z.string().nullable()
})


export type Board = z.infer<typeof BoardSchema>

const ColumnSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    color: z.string(),
    position: z.number(),
    createdAt: z.string(),
})

const CreateColumnSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().max(32).optional(),
})

const UpdateColumnSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    color: z.string().max(32).optional(),
})

export type Column = z.infer<typeof ColumnSchema>
export type CreateColumn = z.infer<typeof CreateColumnSchema>
export type UpdateColumn = z.infer<typeof UpdateColumnSchema>

const TaskSchema = z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    columnId: z.string(),
    source: z.enum(['internal', 'external']),
    createdBy: z.string().nullable(),
    boardId: z.string(),
    pr: z.number()
})

const CreateTaskSchema = TaskSchema.omit({ id: true, pr: true }).extend({
    source: z.enum(['internal', 'external']).optional(),
    createdBy: z.string().nullable().optional(),
})

export type CreateTask = z.infer<typeof CreateTaskSchema>
export type Task = z.infer<typeof TaskSchema>
export type Priority = Task['priority']

export type TaskWithBoard = Task & { boardName: string }

const ApiKeySchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    prefix: z.string(),
    lastUsedAt: z.string().nullable(),
    createdAt: z.string(),
})

export type ApiKey = z.infer<typeof ApiKeySchema>
