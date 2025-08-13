# Secure IoT Deployment Management System

## What is the Secure IoT Deployment Management System?

We built this system to solve real security problems in IoT networks. As companies connect more devices to their networks, managing security becomes incredibly challenging. Our platform helps you secure, monitor, and manage all your IoT devices from one place, so you can protect your network from vulnerabilities before they become serious problems.

## Features We're Proud Of

### What You Get
- **Strong Security**: We use proper authentication with different access levels for different team members
- **See Everything in Real-time**: Watch your device performance as it happens
- **Find Weaknesses Fast**: Our security scanners automatically find problems before hackers do
- **Detect Strange Behavior**: The system notices when devices start acting unusually
- **Never Miss a Problem**: Get instant alerts when something needs attention
- **Rock-solid Database**: Enterprise-grade data storage that won't let you down

### Under the Hood
- **Powerful Backend**: Built with NestJS and TypeScript for reliability
- **Smooth User Interface**: Modern React frontend that's easy to use
- **Smart Device Monitoring**: Lightweight Python agents that won't slow your devices
- **Quick to Deploy**: Docker support so you can get up and running fast
- **Works in the Background**: Efficient job processing that doesn't hog resources
- **Developer Friendly**: Well-documented APIs for your team to build on

### Security That Works
- **Everything Encrypted**: All communications are protected
- **Bulletproof Data**: Input validation to block malicious data
- **Protection from Attacks**: Rate limits to stop denial-of-service attempts
- **Login You Can Trust**: Industry-standard authentication
- **The Right Access**: Team members only see what they need to

## Why People Choose Our System

We built this after seeing the same IoT security problems over and over:

1. **Stop Problems Before They Start**: Find and fix device vulnerabilities before anyone can exploit them
2. **One Dashboard for Everything**: No more juggling multiple tools - see and manage all your devices in one place
3. **Stay Compliant Without the Headache**: Keep your devices in line with your security policies without constant manual checking
4. **Respond to Issues in Minutes, Not Days**: Get alerted immediately when something's wrong and fix it fast
5. **Save Time and Hassle**: Set it up once, and the system handles monitoring, scanning, and updates automatically

## What You'll Need

### Computer Requirements

- **Works On**: Any recent Windows, Mac, or Linux system
- **Processor**: Dual core for testing, quad core or better for real use
- **Memory**: 4GB will work, 8GB or more makes it happier
- **Disk Space**: At least 20GB free

### Software You'll Need

- **Node.js**: Version 16 or newer
- **npm**: Version 7 or newer
- **PostgreSQL**: Version 13 or newer
- **Docker**: Version 20+ if you want to use containers (recommended)
- **Redis**: Version 6 or newer
- **Browser**: Any modern browser like Chrome, Firefox, Edge, or Safari

### Skills for Customizing

If you want to customize or extend the system, you'll need:
- Some JavaScript/TypeScript experience
- Familiarity with React
- Basic understanding of NestJS
- SQL knowledge (we use Prisma to make this easier)
- Docker basics
- Python basics (for modifying device agents)

## Getting Started

### How to Install (Step-by-Step)

#### Option 1: Standard Setup

1. **Get the Code**
   ```bash
   git clone https://github.com/georgem66/Secure-IoT-Deployment-Management-System.git
   cd Secure-IoT-Deployment-Management-System
   ```

2. **Set Up Your Database**
   ```bash
   # On Windows:
   # Download PostgreSQL from https://www.postgresql.org/download/windows/ and follow the installer
   
   # On Ubuntu:
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Create your database and user
   sudo -u postgres psql
   CREATE DATABASE iot_security_db;
   CREATE USER iot_admin WITH ENCRYPTED PASSWORD 'secure_password_2024';
   GRANT ALL PRIVILEGES ON DATABASE iot_security_db TO iot_admin;
   \q
   ```

3. **Set Up Redis** (for background tasks)
   ```bash
   # On Windows:
   # Download from https://redis.io/download and follow the instructions
   
   # On Ubuntu:
   sudo apt update
   sudo apt install redis-server
   sudo systemctl enable redis-server
   ```

4. **Set Up the Backend**
   ```bash
   cd backend
   npm install
   
   # Copy the example config file
   cp .env.example .env
   
   # Open .env in your favorite editor and update these settings:
   # DATABASE_URL="postgresql://iot_admin:secure_password_2024@localhost:5432/iot_security_db"
   # REDIS_HOST="localhost"
   # JWT_SECRET="make-up-a-random-string-here"
   # CORS_ORIGIN="http://localhost:3001"
   
   # Set up your database tables
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   
   # Start the server
   npm run start:dev
   ```

5. **Set Up the Frontend**
   ```bash
   cd ../frontend
   npm install
   
   # Copy the example config file
   cp .env.example .env
   
   # Update these settings:
   # VITE_API_URL=http://localhost:3000
   # VITE_WEBSOCKET_URL=ws://localhost:3000
   
   # Start the frontend
   npm run dev
   ```

6. **Connect External Services**
   ```bash
   # Add these to your backend/.env file:
   
   # For vulnerability data (get a free key at https://nvd.nist.gov/developers/request-an-api-key)
   NVD_API_KEY="your-nvd-api-key"
   
   # For environmental monitoring (optional)
   WEATHER_API_KEY="your-weather-api-key"
   
   # For sending alert emails
   SMTP_HOST="smtp.example.com"
   SMTP_PORT=587
   SMTP_USER="your-email@example.com"
   SMTP_PASSWORD="your-email-password"
   ```

7. **Install Monitoring on Your IoT Devices**
   ```bash
   cd ../device-agent
   
   # If you're on Linux/Mac:
   chmod +x install.sh
   ./install.sh
   
   # If you're on Windows:
   # Double-click install.bat
   
   # Set up the agent config
   cp config/agent.json.example config/agent.json
   
   # Edit config/agent.json to include:
   # {
   #   "server_url": "http://your-server-ip:3000",
   #   "device_key": "pick-a-unique-name-per-device",
   #   "scan_interval": 60,
   #   "sensors": ["cpu", "memory", "disk", "network"]
   # }
   
   # First-time registration
   python agent.py --register
   
   # Run the monitoring agent
   python agent.py
   ```

#### Option 2: Docker Setup (Recommended for production)

1. **Before You Start**
   - Make sure Docker and Docker Compose are installed on your system
   - Check that ports 3000, 3001, 5432, and 6379 aren't being used by other apps

2. **Set Up Configuration**
   ```bash
   # Copy the example config
   cp .env.example .env
   
   # Edit .env to add your settings:
   # - Generate a strong JWT_SECRET
   # - Add your API keys
   # - Configure email settings
   ```

3. **Start Everything Up**
   ```bash
   # This builds and starts all the services
   docker-compose up -d
   
   # If you want to see what's happening
   docker-compose logs -f
   
   # Need to handle more traffic? Scale up the backend
   docker-compose up -d --scale backend=3
   ```

4. **Check Everything's Working**
   ```bash
   # See if all containers are running
   docker-compose ps
   
   # First time only: Set up your database
   docker-compose exec backend npm run prisma:migrate
   docker-compose exec backend npm run prisma:seed
   ```

### Setting Up Your System

1. **First Login**
   - Open your web browser and go to `http://localhost:3001`
   - Log in with the starter account: username `admin@example.com`, password `SecureIoT2024!`
   - Change this password immediately (seriously, don't skip this)
   - If you see a setup wizard, follow the steps to configure your system

2. **Security Settings**
   - Go to **Settings** → **Security**
   - Set up your password rules (length, complexity, etc.)
   - Configure how long users stay logged in
   - Turn on two-factor authentication if needed
   - Set up HTTPS for better security (we strongly recommend this)

3. **Connect Other Services**
   - Go to **Settings** → **Integrations**
   - Connect to the NVD database for vulnerability information
   - Hook up your security tools like Splunk or ELK (if you use them)
   - Set up email or SMS notifications
   - Configure webhooks if you need to send data to other systems

4. **Add Your Devices**
   - Click on the **Devices** section
   - Use "Add Device" to manually add each device
   - Got lots of devices? Import them from a CSV file
   - Create groups to organize your devices (like "Production Floor" or "Office")
   - Set up what data to collect from each device
   - Schedule regular security scans

5. **Set Security Rules**
   - Go to **Security** → **Policies**
   - Create security profiles based on standards you follow (like NIST or ISO)
   - Decide what level of vulnerabilities should trigger alerts
   - Set up automatic fixes for common problems
   - Configure who gets notified when issues are found

6. **Keep an Eye on Everything**
   - The main dashboard shows you the overall health of your system
   - Create custom views for specific teams or purposes
   - Schedule reports to be emailed daily, weekly, or monthly
   - Set thresholds for when to alert you about problems

## Keeping Your System Running Smoothly

### Regular Maintenance
- **Back Up Your Data Regularly**:
  ```bash
  # Create a database backup
  pg_dump -U iot_admin -d iot_security_db > backup_$(date +%Y%m%d).sql
  
  # Make your database run faster
  cd backend
  npm run db:optimize
  ```
- **Keep Everything Updated**:
  ```bash
  # Update the server software
  cd backend && npm update
  cd ../frontend && npm update
  
  # Update the software on your IoT devices
  ./deploy-agent-updates.sh
  ```
- **Manage Your Log Files**:
  ```bash
  # Set up automatic log cleanup on Linux
  sudo nano /etc/logrotate.d/iot-security
  ```

### Fixing Connection Problems
- **Database Not Working**:
  ```bash
  # Check if PostgreSQL is running
  sudo systemctl status postgresql
  
  # Test if you can connect
  psql -h localhost -U iot_admin -d iot_security_db -c "SELECT 1"
  
  # Look at the server logs for errors
  tail -f backend/logs/app.log
  ```
- **API Not Responding**:
  ```bash
  # Check if the API is up
  curl -I http://localhost:3000/api/health
  
  # See what's happening in the logs
  cd backend && npm run logs
  ```
- **Device Agents Not Connecting**:
  ```bash
  # Check the agent's log file
  cat /var/log/device-agent/connection.log
  
  # Test if the device can reach the server
  curl -I http://your-server-ip:3000/api/health
  ```

### Making It Run Faster
- **Slow Dashboard**: Add Redis caching to speed up common queries
- **Using Too Many Resources**: Adjust the limits in your `docker-compose.yml` file
- **Database Getting Too Big**:
  ```bash
  # Set up automatic cleanup of old data
  cd backend
  npm run prisma:execute -- --file=./scripts/setup-retention.sql
  ```

### Beefing Up Security
- **Stop API Abuse**:
  ```typescript
  // Open backend/src/main.ts and add this:
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // only 100 requests per IP in that window
    })
  );
  ```
- **Adding HTTPS**:
  ```bash
  # Create your own certificate (just for testing)
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.cert
  
  # Tell the backend to use it
  # In your backend/.env file add:
  USE_HTTPS=true
  SSL_KEY_PATH=./server.key
  SSL_CERT_PATH=./server.cert
  ```

## Connecting Other Systems to Our API

We've built this system to play well with others. Here's how to connect your other tools to our API.

### Getting Access to the API

```javascript
// First, get yourself a token
const response = await fetch('http://your-server/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'api@example.com', password: 'password' })
});
const { access_token } = await response.json();

// Now you can make calls to the API
const deviceData = await fetch('http://your-server/api/devices', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

### Main API Sections

- **Auth Stuff**: `/api/auth/*` - Log in, register, refresh tokens
- **Device Management**: `/api/devices/*` - Add, edit, delete devices
- **Device Data**: `/api/telemetry/*` - Get performance metrics
- **Security Scans**: `/api/vulnerability/*` - Check for security issues
- **Notifications**: `/api/alerts/*` - Handle system alerts
- **User Control**: `/api/users/*` - Add and manage system users

### Getting Real-Time Updates

```javascript
// Use WebSockets to get instant notifications
import { io } from 'socket.io-client';

const socket = io('http://your-server', {
  extraHeaders: { Authorization: `Bearer ${access_token}` }
});

// Know when a device changes status
socket.on('device:status', (data) => {
  console.log('Device just changed status:', data);
});

// Get alerts as they happen
socket.on('alert:new', (alert) => {
  console.log('Just got a new alert:', alert);
});
```

### Where to Find Full API Docs

We've got interactive docs you can play with:

- **During Development**: http://localhost:3000/api/docs
- **On Your Server**: https://your-domain.com/api/docs

### Setting Up API Keys for Services

For server-to-server connections, you can use API keys instead of tokens:

1. Go to **Settings** → **API Keys**
2. Hit **Create New API Key**
3. Choose what this key can access and when it expires
4. Save the key when it shows up (you won't see it again)

Using your API key is simple:

```bash
curl -H "X-API-Key: your-api-key" http://your-server/api/devices
```