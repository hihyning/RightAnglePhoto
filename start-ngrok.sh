#!/bin/bash

# Script to start ngrok tunnel for local development
# This creates an HTTPS tunnel to your local Vite dev server

echo "🚀 Starting ngrok tunnel..."
echo ""
echo "Make sure your dev server is running on port 5173!"
echo "If not, run 'npm run dev' in another terminal first."
echo ""

# Start ngrok tunnel on port 5173 (default Vite port)
ngrok http 5173

