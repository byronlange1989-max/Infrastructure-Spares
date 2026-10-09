# Deploying Infrastructure Spares to an Internal Linux Server

This guide explains how to deploy this project on your internal Linux server (Ubuntu, Debian, RHEL, Rocky Linux, CentOS, etc.).

---

## Method 1: Docker & Docker Compose (Recommended)

This is the easiest and most isolated method. It automatically manages dependencies, builds the production app, and keeps your component inventory in a persistent volume.

### Prerequisites
- Docker and Docker Compose installed:
  ```bash
  sudo apt update && sudo apt install -y docker.io docker-compose-v2
  ```

### Steps

1. **Copy the project to your server**:
   ```bash
   scp -r ./infrastructure-spares user@your-server-ip:/opt/infrastructure-spares
   ```

2. **Navigate to the directory**:
   ```bash
   cd /opt/infrastructure-spares
   ```

3. **Start the container in detached mode**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify it is running**:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

Your server is now live at `http://<your-server-ip>:3000`!
All inventory data is stored in `./data/inventory.json` on the host, so data persists across container updates.

---

## Method 2: Native Linux Service via Systemd

If you prefer running directly on the host using Node.js:

### Prerequisites
- Node.js (v18 or v20 LTS) and npm installed:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  ```

### Steps

1. **Copy the code to `/opt/infrastructure-spares`**:
   ```bash
   sudo mkdir -p /opt/infrastructure-spares
   sudo cp -r ./* /opt/infrastructure-spares/
   cd /opt/infrastructure-spares
   ```

2. **Install dependencies and build**:
   ```bash
   npm install
   npm run build
   ```

3. **Install the systemd service**:
   ```bash
   sudo cp infrastructure-spares.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable infrastructure-spares
   sudo systemctl start infrastructure-spares
   ```

4. **Check status**:
   ```bash
   sudo systemctl status infrastructure-spares
   ```

---

## Method 3: Using PM2 (Process Manager)

1. **Install PM2 globally**:
   ```bash
   sudo npm install -g pm2
   ```

2. **Build and start**:
   ```bash
   cd /opt/infrastructure-spares
   npm install
   npm run build
   pm2 start "npm start" --name "infrastructure-spares"
   pm2 save
   pm2 startup
   ```

---

## Optional: Nginx Reverse Proxy (Port 80 / 443 with SSL)

To access the app via standard port 80 or with your internal company domain/DNS (e.g. `http://spares.internal.local`):

1. **Install Nginx**:
   ```bash
   sudo apt install -y nginx
   ```

2. **Create config** (`/etc/nginx/sites-available/infrastructure-spares`):
   ```nginx
   server {
       listen 80;
       server_name spares.internal.local; # or your server IP

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable and restart Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/infrastructure-spares /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
