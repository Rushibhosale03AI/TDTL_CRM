import { useState, useEffect, useCallback } from 'react'
import { contactsAPI } from '../services/api'
import { useStore } from '../store/state'

const MOCK_CONTACTS = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@techinfo.com',
    phone: '+91-90000-10001',
    company: 'TechInfo Tech',
    industry: 'IT',
    designation: 'Project Manager',
    location: 'Bangalore',
    lead: { id: 1, name: 'priya - TechInfo Tech' },
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah@newcompany.com',
    phone: '+91-90000-10002',
    company: 'New Company',
    industry: 'Finance',
    designation: 'Finance Head',
    location: 'Chennai',
    lead: { id: 2, name: 'New Lead - New Company' },
  },
  {
    id: 3,
    name: 'Amit Kumar',
    email: 'amit@globaltech.com',
    phone: '+91-90000-10003',
    company: 'Global Tech',
    industry: 'Software',
    designation: 'Operations Manager',
    location: 'Delhi',
    lead: { id: 4, name: 'ashwini - Global Tech' },
  },
]

export const useContacts = () => {
  const { contacts, setContacts } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({})

  const fetchContacts = useCallback(async (params = {}) => {
    try {
      setLoading(true)
      try {
        const response = await contactsAPI.list({ ...filters, ...params })
        setContacts(response.data.results || response.data)
      } catch (apiError) {
        console.warn('Using mock contacts data:', apiError.message)
        setContacts(MOCK_CONTACTS)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, setContacts])

  const createContact = async (contactData) => {
    try {
      const response = await contactsAPI.create(contactData)
      const newContact = response.data
      setContacts([newContact, ...contacts])
      return newContact
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  const updateContact = async (id, contactData) => {
    try {
      const response = await contactsAPI.update(id, contactData)
      const updatedContact = response.data
      setContacts(contacts.map(c => c.id === id ? updatedContact : c))
      return updatedContact
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  const deleteContact = async (id) => {
    try {
      await contactsAPI.delete(id)
      setContacts(contacts.filter(c => c.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  return { contacts, loading, error, fetchContacts, createContact, updateContact, deleteContact, setFilters }
}
