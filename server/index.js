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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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
    
    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: responseData
    });
  } catch (error) {
    if (error.response) {
      res.status(200).json({ 
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        isError: true
      });
    } else if (error.request) {
      console.error('Proxy Error (No Response):', error.message);
      res.status(500).json({ message: 'No response received from target', error: error.message });
    } else {
      console.error('Proxy Error (Setup):', error.message);
      res.status(500).json({ message: 'Error setting up request', error: error.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
