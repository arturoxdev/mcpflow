import { z } from 'zod'

const BoardSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    description: z.string(),
    publicInboxEnabled: z.boolean(),
    createdAt: z.string()
})


export type Board = z.infer<typeof BoardSchema>

const TaskSchema = z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    status: z.enum(['todo', 'doing', 'done']),
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
export type Status = Task['status']

const ApiKeySchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    prefix: z.string(),
    lastUsedAt: z.string().nullable(),
    createdAt: z.string(),
})

export type ApiKey = z.infer<typeof ApiKeySchema>
