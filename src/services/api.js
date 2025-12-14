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
  },
  
  getCollectionsByModule: async (projectName, moduleName) => {
    try {
      const token = sessionStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`Fetching collections for Project: ${projectName}, Module: ${moduleName}`);
      const res = await axios.post(PROXY_URL, {
        method: 'POST',
        // Assuming this is the endpoint based on the requirement
        url: 'http://localhost:8080/collections/search', 
        headers: headers,
        data: {
          projectName: projectName,
          moduleName: moduleName
        }
      });

      console.log('Collections fetched:', res.data);
      if (res.data && res.data.data) {
          return res.data.data;
      }
      return [];
    } catch (error) {
      console.error('Fetching collections failed:', error);
      throw error;
    }
  },

  getCollectionsByProjectId: async (projectId) => {
    try {
      const token = sessionStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`Fetching collections for Project ID: ${projectId}`);
      const res = await axios.post(PROXY_URL, {
        method: 'GET',
        url: `http://localhost:8080/projects/${projectId}/collections`,
        headers: headers
      });

      console.log('Collections fetched by ID:', res.data);
      if (res.data && res.data.data) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error('Fetching collections by ID failed:', error);
      throw error;
    }
  }
};
