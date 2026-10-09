#!/usr/bin/env bash
set -e

echo "=== Infrastructure Spares Deployment Script ==="

# Check Node version
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js (version 18 or 20+)."
    exit 1
fi

echo "1. Installing dependencies..."
npm install

echo "2. Building frontend production bundle..."
npm run build

echo "3. Ensuring data directory exists..."
mkdir -p data

echo "=== Build Complete! ==="
echo "To start the server directly:"
echo "   npm start"
echo ""
echo "Or with PM2 (recommended for background running):"
echo "   npm install -g pm2"
echo "   pm2 start 'npm start' --name infrastructure-spares"
echo "   pm2 save && pm2 startup"
echo ""
echo "Or with Docker:"
echo "   docker compose up -d"
