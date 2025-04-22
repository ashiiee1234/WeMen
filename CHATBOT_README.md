# WeMen Chatbot Setup Guide

This guide explains how to set up and deploy the chatbot with a secure backend for your WeMen platform.

## Local Development

### 1. Set up the Node.js backend
```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Create a .env file with your OpenRouter API key
echo "OPENROUTER_API_KEY=your_api_key_here" > .env
echo "PORT=3000" >> .env

# Start the development server
npm run dev
```

### 2. Test the frontend
Open `pages/legal-advice.html` in your browser and test the chatbot. It should now make requests to your local backend server instead of directly to OpenRouter.

## Production Deployment

### Option 1: Deploy with a Node.js hosting service (Recommended)

1. Deploy the Node.js server to a hosting service like:
   - Heroku
   - Vercel
   - Render
   - Railway
   - DigitalOcean App Platform

2. Set the environment variable `OPENROUTER_API_KEY` in your hosting dashboard.

3. Deploy your static files (HTML, CSS, JS) to a service like Netlify, Vercel, or any static hosting.

### Option 2: Deploy with Docker

1. Build the Docker image:
```bash
cd server
docker build -t wemen-server .
```

2. Run the container:
```bash
docker run -p 3000:3000 -e OPENROUTER_API_KEY=your_api_key_here wemen-server
```

3. For cloud deployment, push the image to Docker Hub or a container registry and deploy to:
   - AWS ECS
   - Google Cloud Run
   - Azure Container Instances
   - DigitalOcean App Platform

### Option 3: Deploy to a traditional VPS

1. Set up a VPS with Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve static files
    location / {
        root /path/to/wemen/;
        try_files $uri $uri/ =404;
    }

    # Proxy API requests to the Node.js server
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. Run the Node.js server with PM2:
```bash
npm install -g pm2
cd server
pm2 start server.js
```

## Security Considerations

1. Never commit your `.env` file with API keys to version control
2. Use HTTPS in production
3. Consider rate limiting your API endpoint
4. Monitor your API usage for unexpected spikes

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify the backend is running and accessible
3. Ensure your API key is valid
4. Check that CORS is properly configured if you get CORS errors 