require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const axios = require('axios');
const { Resend } = require('resend');

const app = express();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const MONGODB_URI = process.env.MONGODB_URI;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

const resend = new Resend(RESEND_API_KEY);

// ✅ Schema defined FIRST, before routes use it
const contentSchema = new mongoose.Schema({
    projects: Array,
    blog: Array,
    skills: Array,
    achievements: Array,
    certifications: Array,
    homeStats: Array,
    techStack: Array
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
        let data = await Content.findOne().setOptions({ bufferCommands: false });
        
        const defaults = {
            projects: [],
            blog: [],
            skills: [],
            achievements: [],
            certifications: [],
            homeStats: [
                { value: "1+", label: "Years Experience" },
                { value: "10+", label: "Projects Completed" },
                { value: "5+", label: "Certifications" },
                { value: "UCSC", label: "Undergraduate" }
            ],
            techStack: ["Python", "JavaScript", "TensorFlow", "PyTorch", "React", "Node.js", "MongoDB", "SQL"]
        };

        if (!data) {
            return res.json(defaults);
        }

        // Merge with defaults to handle existing documents missing new fields
        const mergedData = {
            ...defaults,
            ...data.toObject()
        };

        res.json(mergedData);
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

// POST contact form submission
app.post('/api/contact', async (req, res) => {
    const { name, email, message, recaptchaResponse } = req.body;

    // 1. Backend Validation
    if (!name || !email || !message || !recaptchaResponse) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    try {
        // 2. reCAPTCHA Verification
        const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaResponse}`;
        const recaptchaVerify = await axios.post(recaptchaUrl);

        if (!recaptchaVerify.data.success) {
            return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed' });
        }

        // 3. Send Email via Resend
        const { data, error } = await resend.emails.send({
            from: 'Contact Form <onboarding@resend.dev>',
            to: ['arshadirfancontactme@gmail.com'],
            subject: `New Contact Form Submission from ${name}`,
            html: `
                <h2>New Message from your Website</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `,
            reply_to: email
        });

        if (error) {
            console.error('Resend Error:', error);
            return res.status(500).json({ success: false, message: 'Failed to send email' });
        }

        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (err) {
        console.error('Contact API Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = app;
app.post('/api/verify', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Incorrect password' });
    }
});