import { useStore } from "../store/state"

export const useAuth = () => {
  const { user, isAuthenticated, loading, setAuth, mockUsers } = useStore()

  // For testing purposes, we'll mock the authentication
  // In a real app, you'd check a token in localStorage or call an API
  const login = (email, password) => {
    // Simulate API call
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setAuth(foundUser);
      return true;
    }
    return false;
  }

  const logout = () => {
    setAuth(null)
  }

  return {
    user,
    isAuthenticated, // use the actual state
    loading,
    login,
    logout,
  }
}
