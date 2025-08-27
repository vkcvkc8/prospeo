const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Proxy endpoint for Prospeo API
app.post('/api/email-finder', async (req, res) => {
  const { first_name, last_name, company } = req.body;
  const apiKey = process.env.PROSPEO_KEY || 'e89cd25c23ea559352eb96d0bc2c4c68'; // Use env var or fallback

  if (!company) {
    return res.status(400).json({ error: 'Company field is required' });
  }

  try {
    console.log(`Processing request for: ${first_name || ''} ${last_name || ''} at ${company}`);
    
    const response = await fetch('https://api.prospeo.io/email-finder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': apiKey
      },
      body: JSON.stringify({ 
        first_name: first_name || '', 
        last_name: last_name || '', 
        company: company 
      })
    });

    const text = await response.text(); // Get raw response
    console.log(`Raw API response for ${first_name || ''} ${last_name || ''}: ${text.substring(0, 100)}...`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, response: ${text}`);
    }

    let data;
    try {
      data = JSON.parse(text); // Attempt to parse as JSON
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
    }

    res.set('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    res.status(500).json({ error: `API request failed: ${error.message}` });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Prospeo Email Finder server running on port ${PORT}`);
  console.log(`📱 Frontend available at: http://localhost:${PORT}`);
  console.log(`🔧 API endpoint: http://localhost:${PORT}/api/email-finder`);
});
