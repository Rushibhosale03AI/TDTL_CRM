import { useState, useEffect, useCallback } from 'react'
import { tasksAPI } from '../services/api'
import { useStore } from '../store/state'

const MOCK_TASKS = [
  {
    id: 1,
    title: 'Follow up with TechInfo',
    description: 'Check on proposal status',
    assigned_to: { id: 1, name: 'Priya Singh' },
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'HIGH',
    status: 'in_progress',
    progress_percentage: 50,
  },
  {
    id: 2,
    title: 'Send contracts to New Company',
    description: 'Finalize contract terms and send for review',
    assigned_to: { id: 2, name: 'Ashwini Desai' },
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'URGENT',
    status: 'todo',
    progress_percentage: 0,
  },
  {
    id: 3,
    title: 'Prepare demo for Global Tech',
    description: 'Customize demo for Global Tech requirements',
    assigned_to: { id: 3, name: 'Rajesh Patel' },
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'MEDIUM',
    status: 'todo',
    progress_percentage: 20,
  },
  {
    id: 4,
    title: 'Client presentation',
    description: 'Present solution to Enterprise Solutions',
    assigned_to: { id: 4, name: 'Neha Gupta' },
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'HIGH',
    status: 'completed',
    progress_percentage: 100,
  },
]

export const useTasks = () => {
  const { tasks, setTasks } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async (params = {}) => {
    try {
      setLoading(true)
      try {
        const response = await tasksAPI.list(params)
        setTasks(response.data.results || response.data)
      } catch (apiError) {
        console.warn('Using mock tasks data:', apiError.message)
        setTasks(MOCK_TASKS)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [setTasks])

  const createTask = async (taskData) => {
    try {
      const response = await tasksAPI.create(taskData)
      const newTask = response.data
      setTasks([newTask, ...tasks])
      return newTask
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  const updateTask = async (id, taskData) => {
    try {
      const response = await tasksAPI.update(id, taskData)
      const updatedTask = response.data
      setTasks(tasks.map(t => t.id === id ? updatedTask : t))
      return updatedTask
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  const deleteTask = async (id) => {
    try {
      await tasksAPI.delete(id)
      setTasks(tasks.filter(t => t.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask }
}
