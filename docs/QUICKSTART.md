# ModNet Microservices - Quick Start Guide

Get ModNet's microservices architecture up and running in 10 minutes!

## Prerequisites

- **Node.js** 20 or higher
- **Docker** and **Docker Compose** (optional, but recommended)
- **Supabase Account** (free tier works fine)
- **Git**

## Step 1: Clone the Repository

```bash
git clone https://github.com/Abhiram2144/ModNet.git
cd ModNet
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be ready (~2 minutes)

### 2.2 Get Your Credentials

In your Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy these values:
   - `Project URL` → This is your `SUPABASE_URL`
   - `anon public` key → This is your `SUPABASE_ANON_KEY`
   - `service_role` key → This is your `SUPABASE_SERVICE_KEY` (keep this secret!)

### 2.3 Set Up Database Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- Create students table
CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  userid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  displayname TEXT,
  profileimage TEXT DEFAULT 'default.png',
  canreview BOOLEAN DEFAULT FALSE,
  review TEXT,
  suggestion TEXT,
  courseid BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create modules table
CREATE TABLE modules (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  courseid BIGINT REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_modules table
CREATE TABLE user_modules (
  id BIGSERIAL PRIMARY KEY,
  userid BIGINT REFERENCES students(id) ON DELETE CASCADE,
  moduleid BIGINT REFERENCES modules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(userid, moduleid)
);

-- Create channels table
CREATE TABLE channels (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  senderid BIGINT REFERENCES students(id) ON DELETE CASCADE,
  moduleid BIGINT REFERENCES modules(id) ON DELETE CASCADE,
  channelid BIGINT REFERENCES channels(id) ON DELETE CASCADE,
  replyto BIGINT REFERENCES messages(id) ON DELETE SET NULL,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile images table
CREATE TABLE profileimages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL
);

-- Insert some sample data
INSERT INTO courses (name, code) VALUES 
  ('Computer Science', 'CS'),
  ('Engineering', 'ENG'),
  ('Business', 'BUS');

INSERT INTO modules (name, code, courseid) VALUES 
  ('Introduction to Programming', 'CS101', 1),
  ('Data Structures', 'CS201', 1),
  ('Algorithms', 'CS301', 1);

INSERT INTO profileimages (name, url) VALUES 
  ('default.png', '/images/profiles/default.png'),
  ('avatar1.png', '/images/profiles/avatar1.png'),
  ('avatar2.png', '/images/profiles/avatar2.png');
```

## Step 3: Configure Environment Variables

### 3.1 Create Root .env File

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
JWT_SECRET=your_random_secret_key_here
ADMIN_PASSWORD=your_secure_admin_password
```

**Generate JWT Secret:**
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3.2 Configure Each Service

The services will read from the root `.env` file when using Docker Compose. For local development without Docker, you can create `.env` files in each service directory.

## Step 4: Start the Services

### Option A: Using Docker Compose (Recommended)

This is the easiest way to get everything running:

```bash
# Start all services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f

# Check health
curl http://localhost:8000/health
```

Services will be available at:
- API Gateway: http://localhost:8000
- Client: http://localhost:3000

### Option B: Manual Start (Development)

If you prefer to run services individually:

#### Terminal 1: Auth Service
```bash
cd services/auth-service
npm install
npm start
```

#### Terminal 2: Messaging Service
```bash
cd services/messaging-service
npm install
npm start
```

#### Terminal 3: Module Service
```bash
cd services/module-service
npm install
npm start
```

#### Terminal 4: Admin Service
```bash
cd services/admin-service
npm install
npm start
```

#### Terminal 5: API Gateway
```bash
cd services/api-gateway
npm install
npm start
```

#### Terminal 6: Client (Frontend)
```bash
cd client
npm install
npm run dev
```

## Step 5: Verify Everything Works

### 5.1 Check Service Health

```bash
# API Gateway health
curl http://localhost:8000/health

# Should return:
{
  "status": "healthy",
  "gateway": "running",
  "services": {
    "auth": "healthy",
    "messaging": "healthy",
    "module": "healthy",
    "admin": "healthy"
  }
}
```

### 5.2 Test User Registration

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'
```

### 5.3 Test User Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the returned `token` for authenticated requests.

### 5.4 Get Modules

```bash
curl http://localhost:8000/api/modules
```

### 5.5 Access the Frontend

Open your browser and go to:
```
http://localhost:3000
```

You should see the ModNet landing page.

## Step 6: Update Frontend to Use API Gateway

The frontend currently connects directly to Supabase. To use the microservices:

### 6.1 Update Environment Variables

Create `client/.env`:

```env
VITE_API_GATEWAY_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 6.2 Create API Client Wrapper

Create `client/src/lib/apiClient.js`:

```javascript
const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';

export const apiClient = {
  // Auth endpoints
  async login(email, password) {
    const response = await fetch(`${API_GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async register(email, password, displayName) {
    const response = await fetch(`${API_GATEWAY_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    return response.json();
  },

  // Module endpoints
  async getModules() {
    const response = await fetch(`${API_GATEWAY_URL}/api/modules`);
    return response.json();
  },

  // Message endpoints
  async getModuleMessages(moduleId) {
    const response = await fetch(`${API_GATEWAY_URL}/api/messages/module/${moduleId}`);
    return response.json();
  },

  async sendMessage(messageData, token) {
    const response = await fetch(`${API_GATEWAY_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(messageData),
    });
    return response.json();
  },
};
```

## Common Issues and Solutions

### Issue 1: Services Won't Start

**Error**: `Cannot find module '@supabase/supabase-js'`

**Solution**:
```bash
cd services/auth-service
npm install
```

### Issue 2: Database Connection Failed

**Error**: `Failed to fetch from Supabase`

**Solution**:
- Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Verify your Supabase project is active
- Check Supabase dashboard for any issues

### Issue 3: CORS Errors

**Error**: `Access to fetch blocked by CORS policy`

**Solution**:
- Ensure API Gateway is running
- Check that the frontend is making requests to the API Gateway (http://localhost:8000)
- Verify CORS is enabled in API Gateway

### Issue 4: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::8001`

**Solution**:
```bash
# Find what's using the port
lsof -i :8001

# Kill the process
kill -9 <PID>

# Or change the port in .env
PORT=8011
```

### Issue 5: Docker Compose Fails

**Error**: `service "auth-service" didn't complete successfully`

**Solution**:
```bash
# Check logs
docker-compose logs auth-service

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## Next Steps

1. **Explore the API**: Check out the [Integration Test Plan](INTEGRATION_TEST_PLAN.md) for all available endpoints
2. **Update Frontend**: Gradually migrate frontend to use API Gateway instead of direct Supabase calls
3. **Add Features**: Extend services with new functionality
4. **Deploy**: Follow the [Deployment Guide](DEPLOYMENT.md) to deploy to production

## Useful Commands

```bash
# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart auth-service

# View service logs
docker-compose logs -f messaging-service

# Remove all containers and volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild a specific service
docker-compose build auth-service

# Run in detached mode
docker-compose up -d

# Scale a service
docker-compose up --scale messaging-service=3
```

## Development Tips

1. **Use nodemon for auto-reload**: Change `npm start` to `npm run dev` in package.json
2. **Debug with logs**: Each service logs to console - use `docker-compose logs -f`
3. **Test endpoints**: Use Postman, Insomnia, or curl for API testing
4. **Monitor health**: Keep an eye on `http://localhost:8000/health`

## Getting Help

- **Documentation**: Check the `docs/` folder
- **Issues**: Open an issue on GitHub
- **Architecture**: See [MICROSERVICES_ARCHITECTURE.md](MICROSERVICES_ARCHITECTURE.md)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Docker Documentation](https://docs.docker.com/)
- [React Documentation](https://react.dev/)

---

**🎉 Congratulations!** You now have ModNet running with a full microservices architecture!
