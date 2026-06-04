import { useState, useEffect } from 'react'
import { userAPI } from '../services/api'

export const useUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await userAPI.list()
      // Backend returns a list or pagination object
      const data = response.data.results || response.data
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return { users, loading, error, fetchUsers }
}
