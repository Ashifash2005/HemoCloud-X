#!/bin/bash
set -e

echo "Starting EC2 Deployment..."

# 1. Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18

echo "Node.js Installed."

# 2. Clone Repository
rm -rf ~/HemoCloud-X
git clone https://github.com/Ashifash2005/HemoCloud-X.git ~/HemoCloud-X

# 3. Setup Backend Environments
if [ -f ~/.env ]; then
  cp ~/.env ~/HemoCloud-X/backend/.env
else
  echo "Warning: ~/.env not found. Please create backend/.env manually."
fi
cd ~/HemoCloud-X/backend/flask_api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

echo "Backend dependencies installed."

# 4. Setup Frontend
echo "VITE_API_BASE_URL=/api" > ~/HemoCloud-X/frontend/.env
cd ~/HemoCloud-X/frontend
npm install
npm run build

echo "Frontend built."

# 5. Systemd Configuration for Gunicorn
sudo mv ~/hemocloud-api.service /etc/systemd/system/hemocloud-api.service
sudo systemctl daemon-reload
sudo systemctl start hemocloud-api
sudo systemctl enable hemocloud-api

# 6. NGINX Reverse Proxy Setup
sudo mv ~/nginx_default /etc/nginx/sites-available/default

# Ensure Nginx can read the ubuntu home directory
sudo chmod 755 /home/ubuntu
sudo chmod 755 /home/ubuntu/HemoCloud-X
sudo chmod 755 /home/ubuntu/HemoCloud-X/frontend
sudo chmod 755 /home/ubuntu/HemoCloud-X/frontend/dist

sudo systemctl restart nginx
sudo systemctl enable nginx

echo "Deployment complete! App is live."
