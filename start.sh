#!/bin/bash

echo "🚀 Starting Negotiation Seismograph..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Creating .env file..."
    
    read -p "Enter your Deepgram API Key: " API_KEY
    
    cat > .env << EOF
DEEPGRAM_API_KEY=$API_KEY
PORT=3001
CLIENT_URL=http://localhost:5173
EOF
    
    echo "✅ .env file created"
fi

echo ""
echo "📦 Installing dependencies..."

# Install root dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
fi

# Install client dependencies
if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client
    npm install
    cd ..
fi

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "🎯 Starting servers..."
echo ""
echo "📡 Backend: http://localhost:3001"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both servers
npm run dev
