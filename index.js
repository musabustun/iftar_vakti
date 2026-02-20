const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5555;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const apiBaseUrl = 'https://ezanvakti.emushaf.net';

// API Proxy Endpoints
app.get('/api/ulkeler', async (req, res) => {
    try {
        const response = await axios.get(`${apiBaseUrl}/ulkeler`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching countries:', error.message);
        res.status(502).json({ error: 'Failed to reach Diyanet API' });
    }
});

app.get('/api/sehirler/:ulke', async (req, res) => {
    try {
        const response = await axios.get(`${apiBaseUrl}/sehirler/${req.params.ulke}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching cities:', error.message);
        res.status(502).json({ error: 'Failed to reach Diyanet API' });
    }
});

app.get('/api/ilceler/:sehir', async (req, res) => {
    try {
        const response = await axios.get(`${apiBaseUrl}/ilceler/${req.params.sehir}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching districts:', error.message);
        res.status(502).json({ error: 'Failed to reach Diyanet API' });
    }
});

app.get('/api/vakitler/:ilce', async (req, res) => {
    try {
        const response = await axios.get(`${apiBaseUrl}/vakitler/${req.params.ilce}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching prayer times:', error.message);
        res.status(502).json({ error: 'Failed to reach Diyanet API' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
