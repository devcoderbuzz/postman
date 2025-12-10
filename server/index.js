/* eslint-disable no-undef */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Proxy endpoint
const axiosInstance = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
});

app.post('/proxy', async (req, res) => {
  try {
    const { method, url, headers, data } = req.body;
    
    // Forward the request
    const response = await axiosInstance({
      method,
      url,
      headers,
      data
    });
    
    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
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
