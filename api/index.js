require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const MONGODB_URI = process.env.MONGODB_URI;

// Connection caching for serverless environments
let cachedConnection = null;

const connectDB = async () => {
    // If we have a connection and it's active, use it
    if (cachedConnection && mongoose.connection.readyState >= 1) {
        return cachedConnection;
    }

    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in Vercel environment variables.');
    }

    try {
        console.log('Connecting to MongoDB Atlas...');
        
        // Cache the connection promise to avoid multiple simultaneous connection attempts
        cachedConnection = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('Connected to MongoDB Atlas');
        return cachedConnection;
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        
        // Clear the cache so we can try again on the next request
        cachedConnection = null;
        
        if (err.message.includes('Could not connect to any servers')) {
            throw new Error('Database connection failed. Most common reasons:\n1. Your IP is not whitelisted in MongoDB Atlas (add 0.0.0.0/0).\n2. Your MONGODB_URI password contains special characters that are not URL-encoded.\n3. Your MONGODB_URI is incorrect.\n\nDetails: ' + err.message);
        }
        throw new Error('Could not connect to MongoDB: ' + err.message);
    }
};

app.use(bodyParser.json());

// API to get content
app.get('/api/data', async (req, res) => {
    try {
        await connectDB();
        const data = await Content.findOne().setOptions({ bufferCommands: false });
        res.json(data || { projects: [], blog: [], skills: [], achievements: [], certifications: [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API to save content
app.post('/api/save', async (req, res) => {
    const { password, data } = req.body;
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Incorrect Password' });
    }
    try {
        await connectDB();
        await Content.findOneAndUpdate({}, data, { upsert: true, bufferCommands: false });
        res.json({ success: true, message: 'Data saved successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Schema definition (keep inside the function file)
const contentSchema = new mongoose.Schema({
    projects: Array,
    blog: Array,
    skills: Array,
    achievements: Array,
    certifications: Array
});

// Check if model already exists to prevent error on re-runs
const Content = mongoose.models.Content || mongoose.model('Content', contentSchema);

module.exports = app;
