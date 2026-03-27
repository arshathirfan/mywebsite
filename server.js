require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Define Schema
const contentSchema = new mongoose.Schema({
    projects: Array,
    blog: Array,
    skills: Array,
    achievements: Array,
    certifications: Array
});

const Content = mongoose.model('Content', contentSchema);

app.use(bodyParser.json());

// API to get content
app.get('/api/data', async (req, res) => {
    try {
        const data = await Content.findOne();
        res.json(data || { projects: [], blog: [], skills: [], achievements: [], certifications: [] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
});

// API to save content
app.post('/api/save', async (req, res) => {
    const { password, data } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Incorrect Password' });
    }

    try {
        await Content.findOneAndUpdate({}, data, { upsert: true });
        res.json({ success: true, message: 'Data saved successfully to Database' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

module.exports = app;
