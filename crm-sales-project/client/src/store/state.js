import { create } from "zustand"

export const useStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  monthlyTarget: 50000,
  leads: [
    { id: 1, name: "John Doe", company: "Acme Corp", email: "john@acme.com", phone: "123-456-7890", status: "New", value: 5000, date: "2024-03-20" },
    { id: 2, name: "Jane Smith", company: "Globex", email: "jane@globex.com", phone: "098-765-4321", status: "Qualified", value: 12000, date: "2024-03-18" },
    { id: 3, name: "Alice Brown", company: "Wayne Ent", email: "alice@wayne.com", phone: "555-0192", status: "Proposal", value: 25000, date: "2024-03-15" },
    { id: 4, name: "Bob Wilson", company: "Stark Ind", email: "bob@stark.com", phone: "555-9999", status: "Won", value: 45000, date: "2024-03-10" },
    { id: 5, name: "Sarah Miller", company: "TechFlow", email: "sarah@techflow.io", phone: "555-4433", status: "Won", value: 32000, date: "2024-02-25" },
    { id: 6, name: "Mike Davis", company: "BuildIt", email: "mike@buildit.com", phone: "555-7711", status: "Won", value: 18000, date: "2024-01-15" },
  ],
  contacts: [
    { id: 1, name: "Tony Stark", company: "Stark Ind", email: "tony@stark.com", phone: "555-3000", industry: "Technology", lastContacted: "2024-03-25", size: "Enterprise", website: "stark.com" },
    { id: 2, name: "Bruce Wayne", company: "Wayne Ent", email: "bruce@wayne.com", phone: "555-1234", industry: "Manufacturing", lastContacted: "2024-03-22", size: "Enterprise", website: "wayne.com" },
    { id: 3, name: "Peter Parker", company: "Daily Bugle", email: "peter@bugle.com", phone: "555-0101", industry: "Media", lastContacted: "2024-03-20", size: "Mid-Market", website: "dailybugle.com" },
  ],
  tasks: [
    { id: 1, title: "Follow up with John Doe", dueDate: "2024-04-18", completed: false, priority: "High" },
    { id: 2, title: "Prepare proposal for Wayne Ent", dueDate: "2024-04-19", completed: true, priority: "High" },
    { id: 3, title: "Set up demo with Globex", dueDate: "2024-04-20", completed: false, priority: "Medium" },
    { id: 4, title: "Check billing status for Stark Ind", dueDate: "2024-04-21", completed: false, priority: "Low" },
  ],
  activities: [
    { id: 1, type: "call", contact: "John Doe", desc: "Outbound call to discuss requirements", date: "2024-03-20 14:30" },
    { id: 2, type: "email", contact: "Alice Brown", desc: "Sent proposal draft for review", date: "2024-03-19 11:15" },
    { id: 3, type: "meeting", contact: "Jane Smith", desc: "In-person discovery session", date: "2024-03-18 09:00" },
    { id: 4, type: "call", contact: "Bob Wilson", desc: "Contract negotiation final talk", date: "2024-03-10 16:45" },
  ],
  setAuth: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ loading }),
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  updateLead: (id, updatedLead) => set((state) => ({
    leads: state.leads.map((l) => (l.id === id ? { ...l, ...updatedLead } : l))
  })),
  deleteLead: (id) => set((state) => ({
    leads: state.leads.filter((l) => l.id !== id)
  })),
  moveLead: (id, newStatus) => set((state) => ({
    leads: state.leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
  })),
  addContact: (contact) => set((state) => ({ contacts: [contact, ...state.contacts] })),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  toggleTask: (id) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
  })),
  addActivity: (activity) => set((state) => ({ activities: [activity, ...state.activities] })),
  setMonthlyTarget: (monthlyTarget) => set({ monthlyTarget }),
}))
