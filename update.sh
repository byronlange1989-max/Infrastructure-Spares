#!/usr/bin/env bash
set -e

echo "=== Pulling latest changes from GitHub ==="
git pull origin main

echo "=== Rebuilding and deploying ==="
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "Updating via Docker Compose..."
    docker compose up -d --build
else
    echo "Updating via native Node.js..."
    npm install
    npm run build
    if systemctl is-active --quiet infrastructure-spares; then
        sudo systemctl restart infrastructure-spares
        echo "systemd service restarted."
    elif command -v pm2 &> /dev/null; then
        pm2 restart infrastructure-spares
        echo "PM2 process restarted."
    fi
fi

echo "=== Deployment update complete! ==="
