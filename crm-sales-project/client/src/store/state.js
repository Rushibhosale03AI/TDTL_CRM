import { create } from "zustand"

export const useStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  setAuth: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ loading }),
  
  // Shared state for backend data
  leads: [],
  setLeads: (leads) => set((state) => ({ leads: typeof leads === 'function' ? leads(state.leads) : leads })),
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  
  contacts: [],
  setContacts: (contacts) => set((state) => ({ contacts: typeof contacts === 'function' ? contacts(state.contacts) : contacts })),
  addContact: (contact) => set((state) => ({ contacts: [contact, ...state.contacts] })),
  
  tasks: [],
  setTasks: (tasks) => set((state) => ({ tasks: typeof tasks === 'function' ? tasks(state.tasks) : tasks })),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
}))
