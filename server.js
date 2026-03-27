require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
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
app.use(express.static(path.join(__dirname, '/')));

// Serve admin.html explicitly
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Initialize DB with data.json if empty
async function initializeDB() {
    try {
        const count = await Content.countDocuments();
        if (count === 0) {
            const dataFile = path.join(__dirname, 'data.json');
            if (fs.existsSync(dataFile)) {
                const rawData = fs.readFileSync(dataFile);
                const jsonData = JSON.parse(rawData);
                await Content.create(jsonData);
                console.log('Database initialized with data.json');
            } else {
                await Content.create({
                    projects: [],
                    blog: [],
                    skills: [],
                    achievements: [],
                    certifications: []
                });
                console.log('Database initialized with empty data');
            }
        }
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

initializeDB();

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
        console.warn(`[Admin] Unauthorized save attempt at ${new Date().toISOString()}`);
        return res.status(401).json({ success: false, message: 'Unauthorized: Incorrect Password' });
    }

    try {
        await Content.findOneAndUpdate({}, data, { upsert: true });
        console.log(`[Admin] Data saved successfully to MongoDB at ${new Date().toISOString()}`);
        res.json({ success: true, message: 'Data saved successfully to Database' });
    } catch (err) {
        console.error('[Admin] Failed to save data to MongoDB:', err);
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

module.exports = app;
