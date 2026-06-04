import { teamsAPI } from '../services/api';

const MOCK_TEAMS = [
  {
    id: 1,
    name: 'South India Sales Team',
    manager: { id: 1, name: 'Supriya Sharma', email: 'supriya@tdtl.com' },
    members: [
      { id: 1, name: 'Priya Singh', email: 'priya@tdtl.com' },
      { id: 2, name: 'Ashwini Desai', email: 'ashwini@tdtl.com' },
    ],
  },
  {
    id: 2,
    name: 'North India Sales Team',
    manager: { id: 2, name: 'Rahul Kumar', email: 'rahul@tdtl.com' },
    members: [
      { id: 3, name: 'Rajesh Patel', email: 'rajesh@tdtl.com' },
      { id: 4, name: 'Neha Gupta', email: 'neha@tdtl.com' },
    ],
  },
]

export const useTeams = () => {
  const fetchTeams = async () => {
    try {
      try {
        const response = await teamsAPI.list();
        return response.data.results || response.data || [];
      } catch (apiError) {
        console.warn('Using mock teams data:', apiError.message);
        return MOCK_TEAMS;
      }
    } catch (error) {
      console.error("Failed to fetch teams", error);
      return [];
    }
  };

  const createTeam = async (teamData) => {
    try {
      const response = await teamsAPI.create(teamData);
      return response.data;
    } catch (error) {
      console.error("Failed to create team", error);
      return null;
    }
  };

  const deleteTeam = async (id) => {
    try {
      await teamsAPI.delete(id);
      return true;
    } catch (error) {
      console.error("Failed to delete team", error);
      return false;
    }
  };

  return { fetchTeams, createTeam, deleteTeam };
};
