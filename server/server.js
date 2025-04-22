require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { getFirestore } = require('./firebase-admin');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Key from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Initialize Firestore
const db = getFirestore();

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
    
    // Store the conversation in Firestore if user ID is provided
    if (req.body.userId) {
      try {
        const chatRef = db.collection('conversations').doc(req.body.userId);
        const timestamp = new Date();
        
        await chatRef.set({
          lastUpdated: timestamp,
          messages: [...req.body.messages, 
            { role: 'assistant', content: data.choices?.[0]?.message?.content || 'No response' }
          ]
        }, { merge: true });
        
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        // Continue with response even if Firestore fails
      }
    }
    
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

// API endpoint to get user conversations
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const chatRef = db.collection('conversations').doc(userId);
    const doc = await chatRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'No conversations found for this user' });
    }
    
    return res.json(doc.data());
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({
      error: 'Failed to fetch conversations',
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