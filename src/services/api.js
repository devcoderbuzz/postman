import axios from 'axios';

const PROXY_URL = 'http://localhost:3001/proxy';

export const apiService = {
  authenticate: async (username, password) => {
    console.log('Mock Authenticating...');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          token: 'mock-jwt-token-12345',
          username: username || 'DevAdmin',
          role: 'developer', // Default to developer if not caught by AuthContext logic
          assignedAppCodes: []
        });
      }, 800);
    });
  },

  getAllProjects: async () => {
    console.log('Fetching Projects...');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([]);
      }, 600);
    });
  },

  getCollectionsByProjectId: async (projectId) => {
    console.log(`Fetching Collections for Project ${projectId}...`);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([]);
      }, 500);
    });
  }
};
