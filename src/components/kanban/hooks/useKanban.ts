'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, Priority, Column } from '@/server'

import { tasksStore } from '@/lib/tasks-store'

interface UseKanbanOptions {
  boardId: string
}

export function useKanban({ boardId }: UseKanbanOptions) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true)
      const [tRes, cRes] = await Promise.all([
        fetch(`/api/boards/${boardId}/tasks`),
        fetch(`/api/columns`),
      ])
      if (!tRes.ok) throw new Error('Failed to fetch tasks')
      if (!cRes.ok) throw new Error('Failed to fetch columns')
      const [tData, cData] = await Promise.all([tRes.json(), cRes.json()])
      setTasks(tData)
      setColumns(cData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [boardId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const addTask = useCallback(
    async (data: {
      title: string
      description: string
      priority: Priority
      columnId?: string
    }) => {
      try {
        const response = await fetch(`/api/boards/${boardId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!response.ok) throw new Error('Failed to create task')
        const newTask = await response.json()
        setTasks((prev) => [...prev, newTask])
        tasksStore.notify()
        return newTask
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        throw err
      }
    },
    [boardId]
  )

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      try {
        const response = await fetch(
          `/api/boards/${boardId}/tasks/${taskId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }
        )
        if (!response.ok) throw new Error('Failed to update task')
        const updatedTask = await response.json()
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? updatedTask : t))
        )
        tasksStore.notify()
        return updatedTask
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        throw err
      }
    },
    [boardId]
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        const response = await fetch(
          `/api/boards/${boardId}/tasks/${taskId}`,
          {
            method: 'DELETE',
          }
        )
        if (!response.ok) throw new Error('Failed to delete task')
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
        tasksStore.notify()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        throw err
      }
    },
    [boardId]
  )

  const moveTask = useCallback(
    async (taskId: string, newColumnId: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, columnId: newColumnId } : t))
      )
      try {
        await updateTask(taskId, { columnId: newColumnId })
      } catch {
        fetchAll()
      }
    },
    [updateTask, fetchAll]
  )

  const getTasksByColumn = useCallback(
    (columnId: string) => tasks.filter((t) => t.columnId === columnId),
    [tasks]
  )

  return {
    tasks,
    columns,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
    refetch: fetchAll,
  }
}
