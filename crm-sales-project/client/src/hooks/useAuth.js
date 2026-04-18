import { useStore } from "../store/state"

export const useAuth = () => {
  const { user, isAuthenticated, loading, setAuth } = useStore()

  // For testing purposes, we'll mock the authentication
  // In a real app, you'd check a token in localStorage or call an API
  const login = (userData) => {
    setAuth(userData)
  }

  const logout = () => {
    setAuth(null)
  }

  return {
    user,
    isAuthenticated: true, // Force true for demo/development purposes
    loading,
    login,
    logout,
  }
}
