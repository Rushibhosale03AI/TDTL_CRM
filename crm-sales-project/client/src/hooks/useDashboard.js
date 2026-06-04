import { useState, useEffect, useCallback } from 'react'
import { dashboardAPI } from '../services/api'
import { useAuth } from './useAuth'

// Comprehensive mock data for all dashboards
const MOCK_DASHBOARD_DATA = {
  admin: {
    overview: {
      totalManagers: 2,
      totalGlobalRevenue: '₹225000',
      totalSalesReps: 4,
    },
    managers: [
      {
        id: 1,
        name: 'Supriya Sharma',
        region: 'India - South',
        teamSize: 2,
        revenue: '₹125000',
        performance: '+25%',
      },
      {
        id: 2,
        name: 'Rahul Kumar',
        region: 'India - North',
        teamSize: 2,
        revenue: '₹100000',
        performance: '+15%',
      },
    ],
    funnelData: [
      { name: 'New', value: 200 },
      { name: 'Follow-up', value: 165 },
      { name: 'Qualified', value: 125 },
      { name: 'Meeting', value: 85 },
      { name: 'Proposal', value: 55 },
      { name: 'Won', value: 35 },
    ],
  },
  manager: {
    overview: {
      totalTeamRevenue: '₹225000',
      activeReps: 4,
      totalTeamLeads: 45,
      teamAttainment: 85,
      taskCompletionRate: 78,
      teamTarget: '₹250000',
    },
    teamPerformance: [
      {
        id: 1,
        name: 'Priya Singh',
        email: 'priya@tdtl.com',
        dealsClosed: 8,
        revenue: '₹95000',
        targetProgress: 95,
        manager: { id: 1, name: 'Supriya Sharma' },
        team: 'South India Sales Team',
        lastUpdate: '2 hours ago',
      },
      {
        id: 2,
        name: 'Ashwini Desai',
        email: 'ashwini@tdtl.com',
        dealsClosed: 6,
        revenue: '₹75000',
        targetProgress: 75,
        manager: { id: 1, name: 'Supriya Sharma' },
        team: 'South India Sales Team',
        lastUpdate: '1 hour ago',
      },
      {
        id: 3,
        name: 'Rajesh Patel',
        email: 'rajesh@tdtl.com',
        dealsClosed: 7,
        revenue: '₹78000',
        targetProgress: 78,
        manager: { id: 2, name: 'Rahul Kumar' },
        team: 'North India Sales Team',
        lastUpdate: '30 mins ago',
      },
      {
        id: 4,
        name: 'Neha Gupta',
        email: 'neha@tdtl.com',
        dealsClosed: 5,
        revenue: '₹62000',
        targetProgress: 62,
        manager: { id: 2, name: 'Rahul Kumar' },
        team: 'North India Sales Team',
        lastUpdate: '45 mins ago',
      },
    ],
    revenueData: [
      { name: 'Jan', revenue: 45000, target: 50000 },
      { name: 'Feb', revenue: 62000, target: 50000 },
      { name: 'Mar', revenue: 58000, target: 50000 },
      { name: 'Apr', revenue: 75000, target: 50000 },
      { name: 'May', revenue: 88000, target: 50000 },
      { name: 'Jun', revenue: 97000, target: 50000 },
    ],
    recentOpportunities: [
      {
        id: 1,
        name: 'priya - TechInfo Tech',
        status: 'Yet to approach',
        value: '₹50',
      },
      {
        id: 2,
        name: 'New Lead - New Company',
        status: 'Yet to approach',
        value: '₹40',
      },
      {
        id: 3,
        name: 'supriya - TDTL',
        status: 'Yet to approach',
        value: '₹75',
      },
    ],
    funnelData: [
      { name: 'New', value: 125 },
      { name: 'Follow-up', value: 98 },
      { name: 'Qualified', value: 75 },
      { name: 'Meeting', value: 52 },
      { name: 'Proposal', value: 35 },
      { name: 'Won', value: 18 },
    ],
  },
  sales: {
    overview: {
      totalRevenue: '₹95000',
      activeLeads: 25,
      totalDeals: 8,
      conversionRate: 32,
      taskCompletionRate: 85,
    },
    revenueData: [
      { name: 'Jan', revenue: 12000, target: 15000 },
      { name: 'Feb', revenue: 18000, target: 15000 },
      { name: 'Mar', revenue: 16000, target: 15000 },
      { name: 'Apr', revenue: 22000, target: 15000 },
      { name: 'May', revenue: 25000, target: 15000 },
      { name: 'Jun', revenue: 28000, target: 15000 },
    ],
    recentOpportunities: [
      {
        id: 1,
        name: 'priya - TechInfo Tech',
        status: 'Yet to approach',
        value: '₹50',
      },
      {
        id: 2,
        name: 'New Lead - New Company',
        status: 'Yet to approach',
        value: '₹40',
      },
      {
        id: 3,
        name: 'supriya - TDTL',
        status: 'Yet to approach',
        value: '₹75',
      },
    ],
    tasks: [
      {
        id: 1,
        title: 'Follow up with TechInfo',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        id: 2,
        title: 'Send contracts to New Company',
        status: 'To Do',
        priority: 'Urgent',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ],
    funnelData: [
      { name: 'New', value: 45 },
      { name: 'Follow-up', value: 32 },
      { name: 'Qualified', value: 22 },
      { name: 'Meeting', value: 15 },
      { name: 'Proposal', value: 10 },
      { name: 'Won', value: 8 },
    ],
  },
}

export const useDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const fetchDashboard = useCallback(async () => {
    if (!user) {
      // If no user, use default mock data for manager role
      console.log('No user, using default mock data')
      setData(MOCK_DASHBOARD_DATA.manager)
      return
    }
    
    try {
      setLoading(true)
      let response
      const userRole = user.role?.toLowerCase()
      
      try {
        // Try to fetch from API first
        if (userRole === 'admin') {
          response = await dashboardAPI.adminSummary()
        } else if (userRole === 'manager') {
          response = await dashboardAPI.managerSummary()
        } else {
          response = await dashboardAPI.salesSummary()
        }
        setData(response.data)
      } catch (apiError) {
        // Fallback to mock data if API fails
        console.warn('API failed, using mock data:', apiError.message)
        let mockData
        if (userRole === 'admin') {
          mockData = MOCK_DASHBOARD_DATA.admin
        } else if (userRole === 'manager') {
          mockData = MOCK_DASHBOARD_DATA.manager
        } else {
          mockData = MOCK_DASHBOARD_DATA.sales
        }
        setData(mockData)
      }
    } catch (err) {
      setError(err.message)
      // Even if there's an error, set mock data
      console.error('Dashboard fetch error:', err)
      setData(MOCK_DASHBOARD_DATA.manager)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return { data, loading, error, fetchDashboard }
}
