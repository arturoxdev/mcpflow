'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, Status, Priority } from '@repo/core'

import { tasksStore } from '@/lib/tasks-store'

interface UseKanbanOptions {
  boardId: string
}

export function useKanban({ boardId }: UseKanbanOptions) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/boards/${boardId}/tasks`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      setTasks(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [boardId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = useCallback(
    async (data: {
      title: string
      description: string
      priority: Priority
      status: Status
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
    async (taskId: string, newStatus: Status) => {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      )
      try {
        await updateTask(taskId, { status: newStatus })
      } catch {
        // Revert on error
        fetchTasks()
      }
    },
    [updateTask, fetchTasks]
  )

  const getTasksByStatus = useCallback(
    (status: Status) => tasks.filter((t) => t.status === status),
    [tasks]
  )

  return {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByStatus,
    refetch: fetchTasks,
  }
}
