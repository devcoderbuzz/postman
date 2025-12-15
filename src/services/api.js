import axios from 'axios';

const PROXY_URL = 'http://localhost:3001/proxy';

// Helper to generate mock requests
const generateRequests = (count, prefix) => {
    return Array.from({ length: count }, (_, i) => {
        const id = i + 1;
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        const method = methods[i % methods.length];
        return {
            requestId: `req-${prefix}-${id}`,
            name: `${prefix} Request ${id}`,
            method: method,
            url: `https://api.mock-service.com/${prefix}/resource/${id}`,
            body: method === 'GET' ? null : `{"id": ${id}, "name": "Item ${id}"}`,
            headers: { "Content-Type": "application/json", "Authorization": "Bearer mock-token" }
        };
    });
};

// Helper to generate mock collections
const generateCollections = (projectId, projectName) => {
    const count = 50; // Requested 50 collections
    return Array.from({ length: count }, (_, i) => {
        const id = i + 1;
        return {
            collectionId: `col-${projectId}-${id}`,
            name: `${projectName} Collection V${id}`,
            requests: generateRequests(Math.floor(Math.random() * 6) + 5, `${projectName}-C${id}`) // 5 to 10 requests
        };
    });
};

const MOCK_PROJECTS = [
    { projectId: '1', projectName: 'Weather App', moduleName: 'Core' },
    { projectId: '2', projectName: 'E-commerce', moduleName: 'Payment' },
    { projectId: '3', projectName: 'E-commerce', moduleName: 'Inventory' },
    { projectId: '4', projectName: 'E-commerce', moduleName: 'UserMgmt' },
    { projectId: '5', projectName: 'Logistics', moduleName: 'Tracking' },
    { projectId: '6', projectName: 'Logistics', moduleName: 'Fleet' },
    { projectId: '7', projectName: 'Social Media', moduleName: 'Feed' },
    { projectId: '8', projectName: 'Social Media', moduleName: 'Messaging' },
    { projectId: '9', projectName: 'Finance', moduleName: 'Reporting' },
    { projectId: '10', projectName: 'Finance', moduleName: 'Audit' }
];

export const apiService = {
  authenticate: async (username, password) => {
    console.log('Mock Authenticating...');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          token: 'mock-jwt-token-12345',
          username: username || 'DevAdmin',
          role: 'developer', // Default to developer for mock purposes, specific overrides handled in AuthContext
          assignedAppCodes: [
            MOCK_PROJECTS[0], // Weather Core
            MOCK_PROJECTS[1], // E-comm Payment
            MOCK_PROJECTS[4], // Logistics Tracking
            MOCK_PROJECTS[6]  // Social Feed
          ]
        });
      }, 800);
    });
  },

  getAllProjects: async () => {
    console.log('Mock Fetching Projects...');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(MOCK_PROJECTS);
      }, 600);
    });
  },

  getCollectionsByProjectId: async (projectId) => {
    console.log(`Mock Fetching Collections for Project ${projectId}...`);
    return new Promise(resolve => {
      setTimeout(() => {
        const project = MOCK_PROJECTS.find(p => p.projectId === projectId);
        if (project) {
            resolve(generateCollections(projectId, project.projectName));
        } else {
            resolve([]);
        }
      }, 500);
    });
  }
};
