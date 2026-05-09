import { z } from 'zod'

const BoardSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    description: z.string(),
    publicInboxEnabled: z.boolean(),
    createdAt: z.string(),
    archivedAt: z.string().nullable(),
    openTaskCount: z.number(),
})


export type Board = z.infer<typeof BoardSchema>

const ColumnSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    color: z.string(),
    position: z.number(),
    isClosed: z.boolean(),
    createdAt: z.string(),
})

const CreateColumnSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().max(32).optional(),
    isClosed: z.boolean().optional(),
})

const UpdateColumnSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    color: z.string().max(32).optional(),
    isClosed: z.boolean().optional(),
})

export type Column = z.infer<typeof ColumnSchema>
export type CreateColumn = z.infer<typeof CreateColumnSchema>
export type UpdateColumn = z.infer<typeof UpdateColumnSchema>

export const SPRINT_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type SprintDay = (typeof SPRINT_DAYS)[number]

export const EFFORT_VALUES = ['low', 'high'] as const
export type Effort = (typeof EFFORT_VALUES)[number]

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
    pr: z.number(),
    sprintId: z.string().nullable(),
    sprintDay: z.enum(SPRINT_DAYS).nullable(),
    sprintPosition: z.number().nullable(),
    effort: z.enum(EFFORT_VALUES).nullable(),
})

// Effort is optional/nullable on creation: the internal TaskForm validates it client-side,
// while Public Inbox and REST API entries are allowed to land with effort = null.
const CreateTaskSchema = TaskSchema.omit({ id: true, pr: true, sprintId: true, sprintDay: true, sprintPosition: true }).extend({
    source: z.enum(['internal', 'external']).optional(),
    createdBy: z.string().nullable().optional(),
    effort: z.enum(EFFORT_VALUES).nullable().optional(),
})

// Update payload at the server boundary stays permissive: REST PATCH can leave effort untouched
// (legacy tasks remain null), and AI agents are not forced to classify on edit. The "no path back
// to null from the UI" rule lives client-side inside TaskForm's own Zod schema.
const UpdateTaskSchema = TaskSchema.omit({ id: true, pr: true, sprintId: true, sprintDay: true, sprintPosition: true }).extend({
    source: z.enum(['internal', 'external']).optional(),
    createdBy: z.string().nullable().optional(),
    effort: z.enum(EFFORT_VALUES).nullable().optional(),
})

export type CreateTask = z.infer<typeof CreateTaskSchema>
export type UpdateTask = z.infer<typeof UpdateTaskSchema>
export type Task = z.infer<typeof TaskSchema>
export type Priority = Task['priority']

export type TaskWithBoard = Task & { boardName: string }

// `sprint_day` and `sprint_position` are derived from drag UX; ScheduleTask is the
// payload the scheduling endpoint accepts. All-or-nothing: either you assign all 3
// to a Sprint slot, or you clear all 3 to remove the Task from any Sprint.
const ScheduleTaskSchema = z.union([
    z.object({
        sprintId: z.string(),
        sprintDay: z.enum(SPRINT_DAYS),
        sprintPosition: z.number().int().nonnegative().optional(),
    }),
    z.object({
        sprintId: z.null(),
        sprintDay: z.null(),
        sprintPosition: z.null(),
    }),
])

export type ScheduleTask = z.infer<typeof ScheduleTaskSchema>

const SprintSchema = z.object({
    id: z.string(),
    userId: z.string(),
    startDate: z.string(), // YYYY-MM-DD (Monday)
    name: z.string().nullable(),
    createdAt: z.string(),
})

const CreateSprintSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
    name: z.string().min(1).max(120).optional(),
})

const UpdateSprintSchema = z.object({
    name: z.string().min(1).max(120).nullable().optional(),
})

export type Sprint = z.infer<typeof SprintSchema>
export type CreateSprint = z.infer<typeof CreateSprintSchema>
export type UpdateSprint = z.infer<typeof UpdateSprintSchema>

const ApiKeySchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    prefix: z.string(),
    lastUsedAt: z.string().nullable(),
    createdAt: z.string(),
})

export type ApiKey = z.infer<typeof ApiKeySchema>
