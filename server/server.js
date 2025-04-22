require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Key from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Proxy endpoint for OpenRouter
app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.referer || 'https://wemen.org',
        'X-Title': 'LexiBot Legal Assistant'
      },
      body: JSON.stringify({
        model: req.body.model || 'anthropic/claude-3-haiku:beta',
        messages: req.body.messages
      })
    });

    const data = await response.json();
    
    // Return the API response directly
    return res.json(data);
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    return res.status(500).json({
      error: 'Failed to get response from the API',
      message: error.message
    });
  }
});

// Optional static file serving
app.use(express.static('../'));

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 