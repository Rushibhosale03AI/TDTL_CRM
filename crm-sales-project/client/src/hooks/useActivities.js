import { useState, useEffect, useCallback } from 'react'
import { activitiesAPI } from '../services/api'

export const useActivities = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchActivities = useCallback(async (params = {}) => {
    try {
      setLoading(true)
      const response = await activitiesAPI.list(params)
      setActivities(response.data.results || response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createActivity = async (activityData) => {
    try {
      const response = await activitiesAPI.create(activityData)
      setActivities(prev => [response.data, ...prev])
      return response.data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return { activities, loading, error, fetchActivities, createActivity }
}
