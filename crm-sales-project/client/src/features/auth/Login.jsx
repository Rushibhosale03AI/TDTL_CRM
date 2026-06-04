import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { LayoutDashboard } from "lucide-react"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login, isAuthenticated, error: authError } = useAuth()
  const navigate = useNavigate()

  // Clear any stale tokens on mount to avoid 401 errors
  React.useEffect(() => {
    const hasOldToken = localStorage.getItem('access_token')
    if (hasOldToken && !isAuthenticated) {
      // Clear potentially invalid tokens
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }, [isAuthenticated])

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }
    
    const success = await login(email, password)
    if (success) {
      navigate("/dashboard")
    } else {
      // Error will be set by authError useEffect
      if (!authError) {
        setError("Login failed. Please check your credentials and try again.")
      }
    }
  }

  // Update local error when authError changes
  React.useEffect(() => {
    if (authError) {
      setError(authError)
    }
  }, [authError])

  const handleTestLogin = (testEmail) => {
    setEmail(testEmail)
    setPassword("password")
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 shadow-lg animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-primary/10 p-3 mb-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to sign in to your account
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              placeholder="m@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none" htmlFor="password">
                Password
              </label>
              <a className="text-sm font-medium text-primary hover:underline" href="#">
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full" type="submit">
            Sign In
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <Link className="underline hover:text-primary" to="/register">
            Sign up
          </Link>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Demo Accounts
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button variant="outline" size="sm" onClick={() => handleTestLogin('admin@test.com')} type="button">
            Login as Admin
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleTestLogin('manager@test.com')} type="button">
            Login as Manager
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleTestLogin('sales@test.com')} type="button">
            Login as Sales Rep
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Login
