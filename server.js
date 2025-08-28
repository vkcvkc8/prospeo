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
  const { first_name, last_name, company, api_key } = req.body;
  
  if (!api_key) {
    return res.status(400).json({ error: 'API key is required' });
  }

  if (!company) {
    return res.status(400).json({ error: 'Company field is required' });
  }

  try {
    console.log(`Processing request for: ${first_name} ${last_name} at ${company}`);
    
    const response = await fetch('https://api.prospeo.io/email-finder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': api_key
      },
      body: JSON.stringify({ 
        first_name: first_name || '', 
        last_name: last_name || '', 
        company: company 
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    console.log(`API response received for ${first_name} ${last_name}`);
    
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