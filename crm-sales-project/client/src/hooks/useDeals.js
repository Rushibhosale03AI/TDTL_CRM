import { useState, useEffect, useCallback } from 'react'
import { dealsAPI } from '../services/api'

const MOCK_DEALS = [
  {
    id: 1,
    name: 'TechInfo - Enterprise Solution',
    stage: 'PROPOSAL',
    amount: 50000,
    probability: 60,
    close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lead: { id: 1, name: 'priya - TechInfo Tech' },
    owner: { id: 1, name: 'Priya Singh' },
  },
  {
    id: 2,
    name: 'New Company - Implementation',
    stage: 'NEGOTIATION',
    amount: 40000,
    probability: 75,
    close_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lead: { id: 2, name: 'New Lead - New Company' },
    owner: { id: 2, name: 'Ashwini Desai' },
  },
  {
    id: 3,
    name: 'TDTL - Premium Package',
    stage: 'CLOSED_WON',
    amount: 75000,
    probability: 100,
    close_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lead: { id: 3, name: 'supriya - TDTL' },
    owner: { id: 1, name: 'Priya Singh' },
  },
  {
    id: 4,
    name: 'Global Tech - Full Suite',
    stage: 'PROSPECTING',
    amount: 100000,
    probability: 30,
    close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lead: { id: 4, name: 'ashwini - Global Tech' },
    owner: { id: 3, name: 'Rajesh Patel' },
  },
]

export const useDeals = () => {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDeals = useCallback(async (params = {}) => {
    try {
      setLoading(true)
      try {
        const response = await dealsAPI.list(params)
        setDeals(response.data.results || response.data)
      } catch (apiError) {
        console.warn('Using mock deals data:', apiError.message)
        setDeals(MOCK_DEALS)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDeal = async (id, dealData) => {
    try {
      const response = await dealsAPI.update(id, dealData)
      setDeals(prev => prev.map(d => d.id === id ? response.data : d))
      return response.data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  return { deals, loading, error, fetchDeals, updateDeal }
}
