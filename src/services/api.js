import axios from 'axios';

const PROXY_URL = 'http://localhost:3001/proxy';

export const apiService = {
  authenticate: async (username, password) => {
    try {
      const res = await axios.post(PROXY_URL, {
        method: 'POST',
        url: 'http://localhost:8080/authenticate',
        headers: { 'Content-Type': 'application/json' },
        data: { username, password }
      });
      
      if (res.data && res.data.data) {
          // Extract token from various potential fields
          const body = res.data.data;
          const token = body.token || body.jwt || body.accessToken;
          return { ...body, token };
      }
      return null;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  },

  getAllProjects: async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await axios.post(PROXY_URL, {
        method: 'GET',
        url: 'http://localhost:8080/appCodes',
        headers: headers
      });

      console.log('Projects fetched 123:', res.data);
      if (res.data && res.data.data) {
          return res.data.data;
      }
      return [];
    } catch (error) {
      console.error('Fetching projects failed:', error);
      throw error;
    }
  }
};
