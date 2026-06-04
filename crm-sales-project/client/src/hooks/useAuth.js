import { useStore } from "../store/state"
import { authAPI } from "../services/api"
import { useState, useEffect } from "react"

export const useAuth = () => {
  const { user, isAuthenticated, loading, setAuth } = useStore()
  const [error, setError] = useState(null)

  const [isChecking, setIsChecking] = useState(() => !!localStorage.getItem('access_token'))

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const response = await authAPI.getUserProfile()
          setAuth(response.data)
        } catch (err) {
          console.error('Auth check failed:', err)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setAuth(null)
        } finally {
          setIsChecking(false)
        }
      } else {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await authAPI.login(email, password)
      const { access, refresh, ...userData } = response.data
      
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setAuth(userData)
      return true
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Login failed'
      setError(message)
      console.error('Login error:', err)
      return false
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      await authAPI.register(userData)
      return true
    } catch (err) {
      let message = 'Registration failed';
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'string') {
          message = errors;
        } else {
          // Join all error messages into a single string
          message = Object.entries(errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
            .join(' | ');
        }
      } else {
        message = err.message || message;
      }
      setError(message)
      console.error('Registration error:', err)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setAuth(null)
    setError(null)
  }

  const updateProfile = async (updateData) => {
    try {
      setError(null)
      const response = await authAPI.updateProfile(updateData)
      setAuth(response.data)
      return true
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Update failed'
      setError(message)
      console.error('Update profile error:', err)
      return false
    }
  }

  return {
    user,
    isAuthenticated,
    loading: loading || isChecking,
    error,
    login,
    register,
    logout,
    updateProfile,
  }
}
