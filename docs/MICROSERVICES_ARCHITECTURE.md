# ModNet Microservices Architecture

## Overview

ModNet has been refactored from a monolithic architecture to a microservices-based architecture to support scalability, independent deployment, and modular ownership.

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (React PWA)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │   API Gateway   │
                  │   (Port 8000)   │
                  └────────┬────────┘
                           │
        ┌──────────────────┼──────────────────┬────────────┐
        ▼                  ▼                  ▼            ▼
  ┌──────────┐      ┌──────────┐      ┌──────────┐  ┌──────────┐
  │   Auth   │      │Messaging │      │  Module  │  │  Admin   │
  │ Service  │      │ Service  │      │ Service  │  │ Service  │
  │(Port 8001)│     │(Port 8002)│     │(Port 8003)│ │(Port 8004)│
  └────┬─────┘      └────┬─────┘      └────┬─────┘  └────┬─────┘
       │                 │                 │             │
       └─────────────────┴─────────────────┴─────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │   Supabase   │
                      │  PostgreSQL  │
                      │   Storage    │
                      │   Realtime   │
                      └──────────────┘
```

## Service Boundaries

### 1. Auth Service (Port 8001)
**Responsibility**: User authentication, authorization, and profile management

**Endpoints**:
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/session` - Get current session
- `GET /auth/profile/:userId` - Get user profile
- `PUT /auth/profile/:userId` - Update user profile

**Database Tables**: `students`, Auth tables (Supabase)

### 2. Messaging Service (Port 8002)
**Responsibility**: Real-time chat, message persistence, and chat history

**Endpoints**:
- `GET /messages/module/:moduleId` - Get module messages
- `GET /messages/group/:groupId` - Get group messages
- `POST /messages` - Send message
- `PUT /messages/:messageId` - Update message
- `DELETE /messages/:messageId` - Delete message
- `WS /ws/messages` - WebSocket for real-time messages

**Database Tables**: `messages`, `channels`

### 3. Module Service (Port 8003)
**Responsibility**: Module management, course management, user-module relationships

**Endpoints**:
- `GET /modules` - List all modules
- `GET /modules/:moduleId` - Get module details
- `POST /modules` - Create module
- `GET /modules/user/:userId` - Get user's enrolled modules
- `POST /modules/:moduleId/enroll` - Enroll in module
- `GET /courses` - List all courses

**Database Tables**: `modules`, `courses`, `user_modules`

### 4. Admin Service (Port 8004)
**Responsibility**: Administrative operations, content moderation, dashboard data

**Endpoints**:
- `POST /admin/login` - Admin login
- `GET /admin/channels` - List all channels
- `POST /admin/channels` - Create channel
- `GET /admin/profile-images` - List profile images

**Database Tables**: `channels`, `profileimages`

### 5. API Gateway (Port 8000)
**Responsibility**: Request routing, authentication middleware, rate limiting, CORS

## Deployment

Each service has its own Dockerfile and can be deployed independently. See individual service README files for details.

## Environment Variables

Each service requires:
- `PORT` - Service port
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Environment (development/production)

## Getting Started

1. Install dependencies for each service:
   ```bash
   cd services/auth-service && npm install
   cd services/messaging-service && npm install
   cd services/module-service && npm install
   cd services/admin-service && npm install
   cd services/api-gateway && npm install
   ```

2. Set up environment variables (copy `.env.example` to `.env` in each service)

3. Start services:
   ```bash
   # Terminal 1
   cd services/auth-service && npm start
   
   # Terminal 2
   cd services/messaging-service && npm start
   
   # Terminal 3
   cd services/module-service && npm start
   
   # Terminal 4
   cd services/admin-service && npm start
   
   # Terminal 5
   cd services/api-gateway && npm start
   ```

4. Start frontend:
   ```bash
   cd client && npm run dev
   ```

## Development with Docker

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up

# Start specific service
docker-compose up auth-service
```
