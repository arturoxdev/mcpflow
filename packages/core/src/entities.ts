import { z } from 'zod'

const BoardSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    description: z.string(),
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
    boardId: z.string(),
    pr: z.number()
})

const CreateTaskSchema = TaskSchema.omit({ id: true, pr: true })

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
