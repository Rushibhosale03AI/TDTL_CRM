import { useState, useEffect, useCallback, useRef } from 'react'
import { leadsAPI, activitiesAPI } from '../services/api'
import { useStore } from '../store/state'

const MOCK_LEADS = [
  // New Lead Stage
  {
    id: 1,
    name: 'priya - TechInfo Tech',
    company: 'TechInfo Tech',
    email: 'contact@techinfo.com',
    phone: '+91-90000-00001',
    designation: 'CTO',
    industry: 'Information Technology',
    location: 'Bangalore',
    source: 'Linkedin',
    status: 'New',
    value: 50000,
    converted: false,
    score: 65,
    owner: 1,
    assignedTo: 1,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Follow-up Stage
  {
    id: 2,
    name: 'New Lead - New Company',
    company: 'New Company',
    email: 'info@newcompany.com',
    phone: '+91-90000-00002',
    designation: 'Manager',
    industry: 'Finance',
    location: 'Chennai',
    source: 'Cold Call',
    status: 'Follow-up',
    value: 40000,
    converted: false,
    score: 45,
    owner: 2,
    assignedTo: 2,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Qualified Stage
  {
    id: 3,
    name: 'supriya - TDTL',
    company: 'TDTL',
    email: 'supriya@tdtl.com',
    phone: '+91-90000-00003',
    designation: 'Director',
    industry: 'Business Services',
    location: 'Bangalore',
    source: 'Referral',
    status: 'Qualified',
    value: 75000,
    converted: false,
    score: 75,
    owner: 1,
    assignedTo: 1,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Meeting Stage
  {
    id: 4,
    name: 'ashwini - Global Tech',
    company: 'Global Tech',
    email: 'ashwini@globaltech.com',
    phone: '+91-90000-00004',
    designation: 'VP Sales',
    industry: 'Software',
    location: 'Delhi',
    source: 'Email',
    status: 'Meeting',
    value: 100000,
    converted: false,
    score: 55,
    owner: 3,
    assignedTo: 3,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Requirements Stage
  {
    id: 5,
    name: 'rajesh - TechCore Solutions',
    company: 'TechCore Solutions',
    email: 'info@techcore.com',
    phone: '+91-90000-00005',
    designation: 'Head of IT',
    industry: 'IT Services',
    location: 'Hyderabad',
    source: 'Website',
    status: 'Requirements',
    value: 85000,
    converted: false,
    score: 70,
    owner: 2,
    assignedTo: 2,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Proposal Stage
  {
    id: 6,
    name: 'neha - InnovateTech Inc',
    company: 'InnovateTech Inc',
    email: 'hello@innovatetech.com',
    phone: '+91-90000-00006',
    designation: 'CIO',
    industry: 'Software Development',
    location: 'Mumbai',
    source: 'Referral',
    status: 'Proposal',
    value: 120000,
    converted: false,
    score: 80,
    owner: 1,
    assignedTo: 1,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Negotiation Stage
  {
    id: 7,
    name: 'vikram - CloudNet Systems',
    company: 'CloudNet Systems',
    email: 'contact@cloudnet.com',
    phone: '+91-90000-00007',
    designation: 'VP Technology',
    industry: 'Cloud Services',
    location: 'Pune',
    source: 'Trade Show',
    status: 'Negotiation',
    value: 150000,
    converted: false,
    score: 85,
    owner: 3,
    assignedTo: 3,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Won Stage
  {
    id: 8,
    name: 'meera - DataDrive Corp',
    company: 'DataDrive Corp',
    email: 'meera@datadrive.com',
    phone: '+91-90000-00008',
    designation: 'Managing Director',
    industry: 'Data Analytics',
    location: 'Bangalore',
    source: 'LinkedIn',
    status: 'Won',
    value: 200000,
    converted: true,
    score: 95,
    owner: 2,
    assignedTo: 2,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Lost Stage
  {
    id: 9,
    name: 'arjun - FutureTech Ltd',
    company: 'FutureTech Ltd',
    email: 'arjun@futuretech.com',
    phone: '+91-90000-00009',
    designation: 'Operations Head',
    industry: 'Manufacturing',
    location: 'Ahmedabad',
    source: 'Cold Call',
    status: 'Lost',
    value: 60000,
    converted: false,
    score: 40,
    owner: 1,
    assignedTo: 1,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Additional leads for various stages for better demo
  {
    id: 10,
    name: 'priya - WebDesign Studio',
    company: 'WebDesign Studio',
    email: 'priya@webdesign.com',
    phone: '+91-90000-00010',
    designation: 'Founder',
    industry: 'Digital Marketing',
    location: 'Bangalore',
    source: 'Facebook',
    status: 'New',
    value: 35000,
    converted: false,
    score: 50,
    owner: 2,
    assignedTo: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 11,
    name: 'anil - SecureIT Systems',
    company: 'SecureIT Systems',
    email: 'anil@secureit.com',
    phone: '+91-90000-00011',
    designation: 'Chief Security Officer',
    industry: 'Cybersecurity',
    location: 'Delhi',
    source: 'Referral',
    status: 'Follow-up',
    value: 95000,
    converted: false,
    score: 72,
    owner: 3,
    assignedTo: 3,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 12,
    name: 'deepak - GreenEnergy Solutions',
    company: 'GreenEnergy Solutions',
    email: 'deepak@greenenergy.com',
    phone: '+91-90000-00012',
    designation: 'Project Manager',
    industry: 'Renewable Energy',
    location: 'Chennai',
    source: 'Website',
    status: 'Qualified',
    value: 110000,
    converted: false,
    score: 78,
    owner: 1,
    assignedTo: 1,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 13,
    name: 'sneha - FinanceHub Pro',
    company: 'FinanceHub Pro',
    email: 'sneha@financehub.com',
    phone: '+91-90000-00013',
    designation: 'VP Finance',
    industry: 'Financial Services',
    location: 'Mumbai',
    source: 'Email Campaign',
    status: 'Proposal',
    value: 180000,
    converted: false,
    score: 82,
    owner: 2,
    assignedTo: 2,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 14,
    name: 'rohan - BuildSmart Construction',
    company: 'BuildSmart Construction',
    email: 'rohan@buildsmart.com',
    phone: '+91-90000-00014',
    designation: 'IT Director',
    industry: 'Construction',
    location: 'Pune',
    source: 'LinkedIn',
    status: 'Meeting',
    value: 140000,
    converted: false,
    score: 76,
    owner: 3,
    assignedTo: 3,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const useLeads = (options = {}) => {
  const { skipFetchOnMount = false } = options
  const { leads, setLeads } = useStore()
  const [loading, setLoading] = useState(!skipFetchOnMount)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null })
  const [filters, setFilters] = useState({})
  const pendingRequests = useRef(new Set())

  const addPendingRequest = (promise) => {
    pendingRequests.current.add(promise)
    promise.finally(() => pendingRequests.current.delete(promise))
    return promise
  }

  const waitForPendingRequests = useCallback(async () => {
    if (pendingRequests.current.size === 0) return
    await Promise.all(Array.from(pendingRequests.current))
  }, [])

  // Fetch leads
  const fetchLeads = useCallback(async (params = {}) => {
    try {
      setLoading(true)
      setError(null)

      const mergedFilters = { ...filters, ...params }
      const cleanedFilters = Object.fromEntries(
        Object.entries(mergedFilters).filter(
          ([_, value]) => value !== "" && value !== null && value !== undefined
        )
      )

      const { page, ...persistedFilters } = cleanedFilters
      if (Object.keys(params).length > 0) {
        setFilters(persistedFilters)
      }

      try {
        const response = await leadsAPI.list(cleanedFilters)
        
        if (response.data.results) {
          setLeads(response.data.results)
          setPagination({
            count: response.data.count,
            next: response.data.next,
            previous: response.data.previous
          })
        } else {
          setLeads(response.data)
          setPagination({ count: response.data.length, next: null, previous: null })
        }
        
        return response.data
      } catch (apiError) {
        // Fallback to mock data
        console.warn('Using mock leads data:', apiError.message)
        setLeads(MOCK_LEADS)
        setPagination({ count: MOCK_LEADS.length, next: null, previous: null })
        return MOCK_LEADS
      }
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Failed to fetch leads'
      setError(message)
      console.error('Fetch leads error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [filters, setLeads, setFilters])

  // Create lead
  const createLead = useCallback(async (leadData) => {
    const request = (async () => {
      try {
        setError(null)
        const response = await leadsAPI.create(leadData)
        const newLead = response.data
        setLeads((prevLeads) => [newLead, ...(Array.isArray(prevLeads) ? prevLeads : [])])
        return newLead
      } catch (err) {
        let message = 'Failed to create lead'
        if (err.response?.data) {
          if (typeof err.response.data === 'object' && !err.response.data.detail) {
            message = Object.entries(err.response.data)
              .map(([key, val]) => {
                const cleanKey = key.replace(/_/g, ' ')
                const cleanVal = Array.isArray(val) ? val.join(', ') : val
                return `${cleanKey}: ${cleanVal}`
              })
              .join(' | ')
          } else {
            message = err.response.data.detail || err.response.data || message
          }
        } else {
          message = err.message || message
        }
        setError(message)
        console.error('Create lead error:', err)
        return null
      }
    })()
    return addPendingRequest(request)
  }, [setLeads])

  // Update lead
  const updateLead = useCallback(async (id, leadData) => {
    const request = (async () => {
      try {
        setError(null)
        const response = await leadsAPI.partialUpdate(id, leadData)
        const updatedLead = response.data
        setLeads((prevLeads) => Array.isArray(prevLeads) ? prevLeads.map(lead => lead.id === id ? updatedLead : lead) : [updatedLead])
        return updatedLead
      } catch (err) {
        let message = 'Failed to update lead'
        if (err.response?.data) {
          if (typeof err.response.data === 'object' && !err.response.data.detail) {
            message = Object.entries(err.response.data)
              .map(([key, val]) => {
                const cleanKey = key.replace(/_/g, ' ')
                const cleanVal = Array.isArray(val) ? val.join(', ') : val
                return `${cleanKey}: ${cleanVal}`
              })
              .join(' | ')
          } else {
            message = err.response.data.detail || err.response.data || message
          }
        } else {
          message = err.message || message
        }
        setError(message)
        console.error('Update lead error:', err)
        return null
      }
    })()
    return addPendingRequest(request)
  }, [setLeads])

  // Delete lead
  const deleteLead = useCallback(async (id) => {
    try {
      setError(null)
      await leadsAPI.delete(id)
      setLeads(Array.isArray(leads) ? leads.filter(lead => lead.id !== id) : [])
      return true
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Failed to delete lead'
      setError(message)
      console.error('Delete lead error:', err)
      return false
    }
  }, [leads, setLeads])

  // Import leads from Excel
  const importLeads = useCallback(async (file) => {
    try {
      setError(null)
      const response = await leadsAPI.importExcel(file)
      await fetchLeads()
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to import leads'
      setError(message)
      console.error('Import leads error:', err)
      return null
    }
  }, [fetchLeads])

  // Get single lead
  const getLead = useCallback(async (id) => {
    try {
      setError(null)
      const response = await leadsAPI.retrieve(id)
      return response.data
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Failed to fetch lead'
      setError(message)
      console.error('Get lead error:', err)
      return null
    }
  }, [])

  // Always fetch on mount to ensure fresh data
  useEffect(() => {
    if (!skipFetchOnMount) {
      fetchLeads()
    }
  }, [fetchLeads, skipFetchOnMount])

  return {
    leads,
    pagination,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    importLeads,
    getLead,
    setFilters,
    waitForPendingRequests,
  }
}
