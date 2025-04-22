# WeMen Backend Server

This is a backend server for the WeMen platform that securely handles API calls to OpenRouter.

## Setup

1. Install dependencies:
```
npm install
```

2. Create a `.env` file with the following variables:
```
OPENROUTER_API_KEY=your_api_key_here
PORT=3000
```

3. Run the server:
```
npm start
```

For development with auto-restart:
```
npm run dev
```

## Docker Deployment

To build and run with Docker:

```
docker build -t wemen-server .
docker run -p 3000:3000 --env-file .env wemen-server
```

## API Endpoints

### POST /api/chat
Proxies requests to OpenRouter's chat completions API.

Request body:
```json
{
  "model": "anthropic/claude-3-haiku:beta",
  "messages": [
    {
      "role": "system",
      "content": "You are LexiBot, a legal advisor..."
    },
    {
      "role": "user",
      "content": "User's question here"
    }
  ]
}
```

Response: Returns the OpenRouter API response directly. 