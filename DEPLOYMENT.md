# Deploying Infrastructure Spares via GitHub to an Internal Linux Server

This guide explains how to push this project to GitHub and deploy it directly on your internal Linux server.

---

## Step 1: Push Project to Your GitHub Repository

Initialize Git and push your code to `byronlange1989-max/Infrastructure-Spares`:
```bash
git init
git add .
git commit -m "Initial commit: Infrastructure Spares"
git branch -M main
git remote add origin https://github.com/byronlange1989-max/Infrastructure-Spares.git
git push -u origin main
```

---

## Step 2: Deploy on Your Linux Server (via GitHub)

SSH into your internal Linux server:

```bash
ssh user@<your-server-ip>
```

### Option A: Using Docker & Docker Compose (Recommended)

1. **Clone the repository**:
   ```bash
   sudo mkdir -p /opt
   cd /opt
   sudo git clone https://github.com/byronlange1989-max/Infrastructure-Spares.git
   cd Infrastructure-Spares
   ```

2. **Build and launch the container**:
   ```bash
   sudo docker compose up -d --build
   ```

3. **Check status**:
   ```bash
   sudo docker compose ps
   sudo docker compose logs -f
   ```

Your app is live on `http://<your-server-ip>:3000`! All inventory data is preserved in `/opt/Infrastructure-Spares/data/`.

---

### Option B: Using Native Node.js & Systemd

1. **Install Node.js 20 LTS on your server**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs git
   ```

2. **Clone the repository**:
   ```bash
   sudo git clone https://github.com/byronlange1989-max/Infrastructure-Spares.git /opt/Infrastructure-Spares
   cd /opt/Infrastructure-Spares
   ```

3. **Install dependencies and build**:
   ```bash
   sudo npm install
   sudo npm run build
   ```

4. **Install and start the systemd service**:
   ```bash
   sudo cp infrastructure-spares.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable infrastructure-spares
   sudo systemctl start infrastructure-spares
   sudo systemctl status infrastructure-spares
   ```

---

## Step 3: Updating Later from GitHub

Whenever you push new changes to GitHub, you can update your Linux server with a single command:

```bash
cd /opt/Infrastructure-Spares
sudo ./update.sh
```

Or manually:
```bash
git pull origin main
sudo docker compose up -d --build   # (if using Docker)
# OR
npm install && npm run build && sudo systemctl restart infrastructure-spares  # (if using Systemd)
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
