import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { LayoutDashboard } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { useStore } from "../../store/state"

const Register = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("sales")
  const [managerId, setManagerId] = useState("")
  const navigate = useNavigate()
  const [managers, setManagers] = useState([])
  const { register, isAuthenticated, error } = useAuth()

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, navigate])

  React.useEffect(() => {
    const fetchManagers = async () => {
      try {
        // Fetch managers from API using the public managers endpoint
        const response = await fetch('http://127.0.0.1:8000/api/auth/managers/');
        if (response.ok) {
          const data = await response.json();
          // Check if data is paginated (has results array) or just an array
          setManagers(data.results || data || []);
        }
      } catch (err) {
        console.error("Failed to fetch managers", err);
      }
    };
    fetchManagers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const [firstName, ...lastNameParts] = name.trim().split(" ")
    const lastName = lastNameParts.join(" ")

    const newUser = {
      first_name: firstName,
      last_name: lastName || "",
      email,
      password,
      role: role.toUpperCase(), // Backend expects uppercase roles
      ...(role === 'sales' && managerId ? { managerId: Number(managerId) } : {})
    }
    
    const success = await register(newUser)
    if (success) {
      navigate("/login")
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 shadow-lg animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-primary/10 p-3 mb-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to get started
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium text-center mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="name">
              Full Name
            </label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            <label className="text-sm font-medium leading-none" htmlFor="role">
              Role
            </label>
            <select 
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                if (e.target.value !== 'sales') setManagerId("")
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="sales">Sales Representative</option>
              <option value="manager">Sales Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          
          {role === 'sales' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium leading-none" htmlFor="manager">
                Select Your Manager
              </label>
              <select 
                id="manager"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                required={role === 'sales'}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select a manager...</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>{manager.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full" type="submit">
            Create Account
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link className="underline hover:text-primary" to="/login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
