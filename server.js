require('dotenv').config();
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// API to save content
app.post('/api/save', (req, res) => {
    const { password, data } = req.body;

    if (password !== ADMIN_PASSWORD) {
        console.warn(`[Admin] Unauthorized save attempt at ${new Date().toISOString()}`);
        return res.status(401).json({ success: false, message: 'Unauthorized: Incorrect Password' });
    }

    fs.writeFile('data.json', JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error('[Admin] Failed to save data:', err);
            return res.status(500).json({ success: false, message: 'Failed to save data' });
        }
        console.log(`[Admin] Data saved successfully at ${new Date().toISOString()}`);
        res.json({ success: true, message: 'Data saved successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
