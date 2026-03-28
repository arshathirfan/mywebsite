require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const MONGODB_URI = process.env.MONGODB_URI;

// ✅ Schema defined FIRST, before routes use it
const contentSchema = new mongoose.Schema({
    projects: Array,
    blog: Array,
    skills: Array,
    achievements: Array,
    certifications: Array
});

const Content = mongoose.models.Content || mongoose.model('Content', contentSchema);

// ✅ Connection caching for serverless environments
let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState >= 1) {
        return cachedConnection;
    }

    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in Vercel environment variables.');
    }

    try {
        console.log('Connecting to MongoDB Atlas...');
        cachedConnection = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected to MongoDB Atlas');
        return cachedConnection;
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        cachedConnection = null;

        if (err.message.includes('Could not connect to any servers')) {
            throw new Error(
                'Database connection failed. Reasons:\n' +
                '1. Whitelist 0.0.0.0/0 in MongoDB Atlas Network Access.\n' +
                '2. URL-encode special characters in your password.\n' +
                '3. Check your MONGODB_URI is correct.\n\nDetails: ' + err.message
            );
        }
        throw new Error('Could not connect to MongoDB: ' + err.message);
    }
};

app.use(bodyParser.json());

// GET content
app.get('/api/data', async (req, res) => {
    try {
        await connectDB();
        const data = await Content.findOne().setOptions({ bufferCommands: false });
        res.json(data || { projects: [], blog: [], skills: [], achievements: [], certifications: [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST save content
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

module.exports = app;