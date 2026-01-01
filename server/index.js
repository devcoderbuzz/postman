/* eslint-disable no-undef */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const logToFile = (message) => {
  try {
      const logPath = path.join(process.cwd(), 'api_debug.log');
      const timestamp = new Date().toISOString();
      fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (e) {
      console.error('Failed to log to file', e);
  }
};

const decodeToken = (token) => {
    try {
        if (!token || !token.includes('.')) return null;
        const base64Payload = token.split('.')[1];
        const payload = Buffer.from(base64Payload, 'base64').toString();
        return JSON.parse(payload);
    } catch (e) {
        return null;
    }
};

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

import { updateProfilePic, getUserProfile, assignProject } from './controllers/userController.js';

// Direct API routes
app.post('/api/users/update-profile-pic', updateProfilePic);

// Proxy endpoint
const axiosInstance = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
});

app.post('/proxy', async (req, res) => {
  try {
    const { method, url, headers, data } = req.body;
    logToFile(`PROXY REQ: ${method} ${url} | bodyDataKeys: ${data ? Object.keys(data).join(',') : 'none'}`);
    console.log(`Proxy hit: ${method} ${url}`);

    // Intercept update profile pic
    if (url && url.includes('/users/update-profile-pic') && method === 'POST') {
       console.log('INTERCEPTED update-profile-pic');
       const mockReq = { body: data };
       const mockRes = {
           status: (code) => ({
               json: (jsonData) => res.json({ 
                   status: code, 
                   statusText: code === 200 ? 'OK' : 'Error',
                   headers: { 'content-type': 'application/json' },
                   data: jsonData,
                   isError: code >= 400 
               })
           })
       };
       return updateProfilePic(mockReq, mockRes);
    }

    // Intercept add project
    /* 
    const isAddProject = url && url.includes('/users/add-project');
    console.log(`Checking interception for add-project: ${url} -> Match? ${isAddProject}`);
    if (isAddProject && method === 'POST') {
       console.log('INTERCEPTED add-project');
       const mockReq = { body: data };
       const mockRes = {
           status: (code) => ({
               json: (jsonData) => res.json({ 
                   status: code, 
                   statusText: code === 200 ? 'OK' : 'Error',
                   headers: { 'content-type': 'application/json' },
                   data: jsonData,
                   isError: code >= 400 
               })
           })
       };
       return assignProject(mockReq, mockRes);
    }
    */
    
    // Forward the request
    const forwardMsg = `FORWARDING TO: ${method} ${url}`;
    logToFile(forwardMsg);
    console.log(forwardMsg);
    
    // Sanitize headers to avoid host/origin mismatches
    const forwardHeaders = {};
    Object.keys(headers || {}).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (!['host', 'connection', 'origin', 'referer', 'content-length'].includes(lowerKey)) {
            forwardHeaders[key] = headers[key];
        }
    });

    // Ensure we don't forward double-stringified JSON
    let finalData = data;
    const contentType = (forwardHeaders['Content-Type'] || forwardHeaders['content-type'] || '').toLowerCase();
    
    if (typeof data === 'string' && contentType.includes('application/json')) {
        try {
            finalData = JSON.parse(data);
            logToFile("Proxy auto-parsed stringified body for forwarding");
        } catch (e) {
            // Keep as string if it's not valid JSON
        }
    }

    logToFile(`FORWARDING DATA: ${JSON.stringify(finalData)}`);

    let response;
    try {
      console.log(`Forwarding to ${url} with headers:`, JSON.stringify(forwardHeaders));
      const authHeader = forwardHeaders['Authorization'] || forwardHeaders['authorization'] || 'MISSING';
      logToFile(`AUTH HEADER: ${authHeader}`);
      
      if (authHeader !== 'MISSING' && authHeader.startsWith('Bearer ')) {
          const decoded = decodeToken(authHeader.split(' ')[1]);
          if (decoded) logToFile(`TOKEN USER: ${decoded.sub || decoded.username || decoded.name}`);
      }

      response = await axiosInstance({
        method,
        url,
        headers: forwardHeaders,
        data: finalData
      });
      const respMsg = `BACKEND RESPONDED: ${response.status} ${response.statusText}`;
      logToFile(respMsg);
      console.log(respMsg);
    } catch (forwardError) {
      const errorMsg = `BACKEND ERROR: ${forwardError.message}`;
      logToFile(errorMsg);
      console.error(errorMsg);
      throw forwardError; // Re-throw to be caught by main catch
    }
    
    let responseData = response.data;
    if (url && url.includes('/projects/hierarchy')) {
        logToFile(`HIERARCHY RESP: ${JSON.stringify(responseData)}`);
    }

    // Intercept responses to inject profile images
    if (url && url.includes('/users/login') && method === 'POST' && responseData) {
        // Inject profile image for login
        const username = data.username || data.userName;
        const storedUser = getUserProfile(responseData.id || responseData.userId, username);
        if (storedUser && storedUser.profileImage) {
            logToFile(`Injecting profile pic for login: ${username}`);
            responseData.profileImage = storedUser.profileImage;
        }
    } else if (url && url.includes('/users/project-count') && method === 'GET' && Array.isArray(responseData)) {
        // Inject profile images for user list
        logToFile(`Injecting profile pics for user list (${responseData.length} users)`);
        responseData = responseData.map(u => {
            const username = u.username || u.userName;
            const stored = getUserProfile(u.id || u.userId, username);
            return stored && stored.profileImage ? { ...u, profileImage: stored.profileImage } : u;
        });
    }

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: responseData
    });
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(200).json({ // Return 200 so frontend receives the error details as data
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        isError: true
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Proxy Error (No Response):', error.message);
      res.status(500).json({ message: 'No response received from target', error: error.message });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Proxy Error (Setup):', error.message);
      res.status(500).json({ message: 'Error setting up request', error: error.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
