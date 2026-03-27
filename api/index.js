require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const MONGODB_URI = process.env.MONGODB_URI;

// Handle MongoDB connection with better error reporting
let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('Connected to MongoDB Atlas');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        throw err;
    }
};

app.use(bodyParser.json());

// Add a test "ping" route to verify the API is alive
app.get('/api/ping', (req, res) => {
    res.json({ success: true, message: 'API is alive and reachable!' });
});

// API to get content
app.get('/api/data', async (req, res) => {
    try {
        await connectDB();
        const data = await Content.findOne();
        res.json(data || { projects: [], blog: [], skills: [], achievements: [], certifications: [] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error: ' + err.message });
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
        await Content.findOneAndUpdate({}, data, { upsert: true });
        res.json({ success: true, message: 'Data saved successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Save error: ' + err.message });
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
