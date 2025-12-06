/* eslint-disable no-undef */
import express from 'express';
import { Sequelize } from 'sequelize';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import { createCollectionModel } from './models/Collection.js';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// MariaDB connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'mydb',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'mysecretpassword',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mariadb',
    logging: false
  }
);

const Collection = createCollectionModel(sequelize);

app.use(cors());
app.use(express.json());

// Sync database
sequelize.sync()
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Failed to sync database:', err));

// Routes

// Save a collection (create or update)
app.post('/api/collections/save', async (req, res) => {
  try {
    const { id, name, projectId, requests } = req.body;
    
    // Upsert using Sequelize
    const [collection, created] = await Collection.upsert({
      id,
      name,
      projectId,
      requests
    });
    
    res.json(collection);
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ message: error.message });
  }
});

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

// Get collections by project ID
app.get('/api/collections/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const collections = await Collection.findAll({
      where: { projectId }
    });
    res.json(collections);
  } catch (error) {
    console.error('Get error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
