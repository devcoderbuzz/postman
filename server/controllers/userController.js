import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/users.json');

const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading user data:', error);
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing user data:', error);
        return false;
    }
};

const logToFile = (message) => {
    try {
        const logPath = path.join(process.cwd(), 'api_debug.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
        console.error('Failed to log to file', e);
    }
};

export const getUserProfile = (userId, username) => {
    try {
        const users = readData();
        return users.find(u => 
            (userId && (u.id == userId || u.userId == userId)) || 
            (username && u.username === username)
        );
    } catch (e) {
        return null;
    }
};

export const updateProfilePic = (req, res) => {
    try {
        const { userId, profileImage } = req.body;
        logToFile(`Update Request - userId: ${userId}, imageLength: ${profileImage?.length}, hasBody: ${!!req.body}`);

        if (!userId || !profileImage) {
            logToFile(`Error: Missing fields - userId: ${userId}, hasImage: ${!!profileImage}`);
            return res.status(400).json({
                message: 'userId and profileImage are required',
                isError: true
            });
        }

        const users = readData();
        const userIndex = users.findIndex(u => 
            u.id == userId || 
            u.userId == userId || 
            (u.username && req.body.username && u.username === req.body.username)
        );

        logToFile(`Search result for user ${userId}: index ${userIndex}`);

        if (userIndex === -1) {
            logToFile(`User not found for ID: ${userId}. Creating new entry.`);
            // Auto-create for dev if not found
            users.push({
                id: userId,
                userId: userId,
                username: req.body.username || 'unknown',
                profileImage: profileImage
            });
            writeData(users);
            
            return res.status(200).json({
                message: 'Pic created successfully.',
                data: { userId, profileImage }
            });
        }

        // Update user
        users[userIndex].profileImage = profileImage;
        
        if (writeData(users)) {
            logToFile(`Success: Updated profile pic for user: ${userId}`);
            return res.status(200).json({
                message: 'Pic updated successfully.',
                data: {
                    userId: users[userIndex].id,
                    profileImage: profileImage
                }
            });
        } else {
            logToFile(`Error: Failed to write to users.json`);
            throw new Error('Failed to save data');
        }

    } catch (error) {
        logToFile(`Exception in updateProfilePic: ${error.message}`);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
            isError: true
        });
    }
};

export const assignProject = (req, res) => {
    try {
        const { userId, projectId } = req.body;
        logToFile(`Assign Project Request - userId: ${userId}, projectId: ${projectId}`);

        if (!userId || !projectId) {
            return res.status(400).json({
                message: 'userId and projectId are required',
                isError: true
            });
        }

        const users = readData();
        const userIndex = users.findIndex(u => u.id == userId || u.userId == userId);

        if (userIndex === -1) {
            logToFile(`User not found for ID: ${userId}`);
            return res.status(404).json({
                message: 'User not found',
                isError: true
            });
        }

        if (!users[userIndex].projectIds) {
            users[userIndex].projectIds = [];
        }

        // Avoid duplicates
        if (!users[userIndex].projectIds.includes(projectId)) {
            users[userIndex].projectIds.push(projectId);
        }

        if (writeData(users)) {
            logToFile(`Success: Assigned project ${projectId} to user ${userId}`);
            return res.status(200).json({
                message: 'Project assigned successfully',
                data: { userId, projectId }
            });
        } else {
            throw new Error('Failed to save data');
        }
    } catch (error) {
        logToFile(`Exception in assignProject: ${error.message}`);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message,
            isError: true
        });
    }
};
