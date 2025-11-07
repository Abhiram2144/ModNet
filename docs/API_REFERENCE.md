# ModNet API Documentation

Complete API reference for all ModNet microservices.

**Base URL**: `http://localhost:8000` (API Gateway)

## Table of Contents

1. [Authentication](#authentication)
2. [Auth Service](#auth-service)
3. [Module Service](#module-service)
4. [Messaging Service](#messaging-service)
5. [Admin Service](#admin-service)
6. [Error Responses](#error-responses)

---

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Get a token by logging in via the Auth Service.

---

## Auth Service

Base path: `/api/auth`

### Register User

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response**: `201 Created`
```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  },
  "profile": {
    "id": 1,
    "displayname": "John Doe",
    "email": "user@example.com",
    "profileimage": "default.png"
  }
}
```

### Login

Authenticate a user and receive a JWT token.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**: `200 OK`
```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here"
  },
  "profile": {
    "id": 1,
    "displayname": "John Doe",
    "email": "user@example.com"
  },
  "token": "custom-jwt-token"
}
```

### Get Session

Get current user session information.

**Endpoint**: `GET /api/auth/session`

**Headers**: `Authorization: Bearer <access_token>`

**Response**: `200 OK`
```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  },
  "profile": {
    "id": 1,
    "displayname": "John Doe"
  }
}
```

### Get User Profile

Get a user's profile by user ID.

**Endpoint**: `GET /api/auth/profile/:userId`

**Response**: `200 OK`
```json
{
  "id": 1,
  "userid": "uuid-here",
  "displayname": "John Doe",
  "email": "user@example.com",
  "profileimage": "default.png",
  "canreview": false,
  "courseid": 1
}
```

### Update Profile

Update user profile information.

**Endpoint**: `PUT /api/auth/profile/:userId`

**Request Body**:
```json
{
  "displayname": "Jane Doe",
  "profileimage": "avatar1.png"
}
```

**Response**: `200 OK`

### Get User Modules

Get modules enrolled by a student.

**Endpoint**: `GET /api/auth/modules/:studentId`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Introduction to Programming",
    "code": "CS101"
  },
  {
    "id": 2,
    "name": "Data Structures",
    "code": "CS201"
  }
]
```

### Logout

Log out the current user.

**Endpoint**: `POST /api/auth/logout`

**Response**: `200 OK`
```json
{
  "success": true
}
```

---

## Module Service

Base path: `/api/modules` and `/api/courses`

### Get All Modules

List all available modules.

**Endpoint**: `GET /api/modules`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Introduction to Programming",
    "code": "CS101",
    "courseid": 1,
    "courses": {
      "id": 1,
      "name": "Computer Science",
      "code": "CS"
    }
  }
]
```

### Get Module by ID

Get details of a specific module.

**Endpoint**: `GET /api/modules/:moduleId`

**Response**: `200 OK`
```json
{
  "id": 1,
  "name": "Introduction to Programming",
  "code": "CS101",
  "courseid": 1,
  "courses": {
    "id": 1,
    "name": "Computer Science",
    "code": "CS"
  }
}
```

### Create Module

Create a new module (admin only).

**Endpoint**: `POST /api/modules`

**Request Body**:
```json
{
  "name": "Advanced Algorithms",
  "code": "CS401",
  "courseid": 1
}
```

**Response**: `201 Created`

### Update Module

Update module information (admin only).

**Endpoint**: `PUT /api/modules/:moduleId`

**Request Body**:
```json
{
  "name": "Updated Module Name",
  "code": "CS401-NEW"
}
```

**Response**: `200 OK`

### Delete Module

Delete a module (admin only).

**Endpoint**: `DELETE /api/modules/:moduleId`

**Response**: `200 OK`
```json
{
  "success": true
}
```

### Enroll in Module

Enroll a user in a module.

**Endpoint**: `POST /api/modules/:moduleId/enroll`

**Request Body**:
```json
{
  "userId": 1
}
```

**Response**: `201 Created`

### Unenroll from Module

Remove a user from a module.

**Endpoint**: `DELETE /api/modules/:moduleId/unenroll`

**Request Body**:
```json
{
  "userId": 1
}
```

**Response**: `200 OK`

### Get All Courses

List all courses.

**Endpoint**: `GET /api/courses`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Computer Science",
    "code": "CS"
  }
]
```

### Get Course by ID

Get details of a specific course.

**Endpoint**: `GET /api/courses/:courseId`

**Response**: `200 OK`

### Get Modules by Course

Get all modules for a specific course.

**Endpoint**: `GET /api/courses/:courseId/modules`

**Response**: `200 OK`

---

## Messaging Service

Base path: `/api/messages`

### Get Module Messages

Get messages for a specific module.

**Endpoint**: `GET /api/messages/module/:moduleId`

**Query Parameters**:
- `limit` (optional): Number of messages to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "content": "Hello everyone!",
    "senderid": 1,
    "moduleid": 1,
    "channelid": null,
    "replyto": null,
    "createdat": "2024-01-01T10:00:00Z",
    "students": {
      "id": 1,
      "displayname": "John Doe",
      "profileimage": "default.png"
    }
  }
]
```

### Get Channel Messages

Get messages for a specific channel.

**Endpoint**: `GET /api/messages/channel/:channelId`

**Query Parameters**: Same as module messages

**Response**: `200 OK`

### Send Message

Send a new message.

**Endpoint**: `POST /api/messages`

**Request Body**:
```json
{
  "content": "This is my message",
  "senderId": 1,
  "moduleId": 1,
  "channelId": null,
  "replyTo": null
}
```

**Response**: `201 Created`
```json
{
  "id": 123,
  "content": "This is my message",
  "senderid": 1,
  "moduleid": 1,
  "createdat": "2024-01-01T10:30:00Z",
  "students": {
    "displayname": "John Doe",
    "profileimage": "default.png"
  }
}
```

### Update Message

Update an existing message (only by sender).

**Endpoint**: `PUT /api/messages/:messageId`

**Request Body**:
```json
{
  "senderId": 1,
  "content": "Updated message content"
}
```

**Response**: `200 OK`

### Delete Message

Delete a message (only by sender).

**Endpoint**: `DELETE /api/messages/:messageId`

**Request Body**:
```json
{
  "senderId": 1
}
```

**Response**: `200 OK`
```json
{
  "success": true
}
```

### Get Channels

List all available channels.

**Endpoint**: `GET /api/messages/channels`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "General",
    "description": "General discussion",
    "createdat": "2024-01-01T00:00:00Z"
  }
]
```

### Get Channel by ID

Get details of a specific channel.

**Endpoint**: `GET /api/messages/channels/:channelId`

**Response**: `200 OK`

---

## Admin Service

Base path: `/api/admin`

**Note**: All admin endpoints require admin authentication.

### Admin Login

Authenticate as an administrator.

**Endpoint**: `POST /api/admin/login`

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "admin_password"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "email": "admin@example.com",
  "role": "admin"
}
```

### Get All Channels

List all channels (admin view).

**Endpoint**: `GET /api/admin/channels`

**Response**: `200 OK`

### Create Channel

Create a new channel.

**Endpoint**: `POST /api/admin/channels`

**Request Body**:
```json
{
  "name": "Study Group",
  "description": "For group study sessions"
}
```

**Response**: `201 Created`

### Update Channel

Update channel information.

**Endpoint**: `PUT /api/admin/channels/:channelId`

**Request Body**:
```json
{
  "name": "Updated Channel Name",
  "description": "Updated description"
}
```

**Response**: `200 OK`

### Delete Channel

Delete a channel.

**Endpoint**: `DELETE /api/admin/channels/:channelId`

**Response**: `200 OK`

### Get Profile Images

List all available profile images.

**Endpoint**: `GET /api/admin/profile-images`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "default.png",
    "url": "/images/profiles/default.png"
  }
]
```

### Add Profile Image

Add a new profile image option.

**Endpoint**: `POST /api/admin/profile-images`

**Request Body**:
```json
{
  "name": "avatar3.png",
  "url": "/images/profiles/avatar3.png"
}
```

**Response**: `201 Created`

### Delete Profile Image

Remove a profile image option.

**Endpoint**: `DELETE /api/admin/profile-images/:imageId`

**Response**: `200 OK`

### Get All Users

List all registered users.

**Endpoint**: `GET /api/admin/users`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "displayname": "John Doe",
    "email": "john@example.com",
    "profileimage": "default.png",
    "canreview": false,
    "courseid": 1
  }
]
```

### Get All Modules (Admin)

List all modules with detailed information.

**Endpoint**: `GET /api/admin/modules`

**Response**: `200 OK`

### Get All Courses (Admin)

List all courses.

**Endpoint**: `GET /api/admin/courses`

**Response**: `200 OK`

### Create Course

Create a new course.

**Endpoint**: `POST /api/admin/courses`

**Request Body**:
```json
{
  "name": "Mathematics",
  "code": "MATH"
}
```

**Response**: `201 Created`

### Update Course

Update course information.

**Endpoint**: `PUT /api/admin/courses/:courseId`

**Response**: `200 OK`

### Delete Course

Delete a course.

**Endpoint**: `DELETE /api/admin/courses/:courseId`

**Response**: `200 OK`

---

## Error Responses

All services use consistent error response format:

### 400 Bad Request
```json
{
  "error": "Email and password are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

### 503 Service Unavailable
```json
{
  "error": "Service temporarily unavailable"
}
```

---

## Rate Limiting

The API Gateway implements rate limiting:
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Response on Limit**: `429 Too Many Requests`

---

## Pagination

For endpoints that support pagination:

**Query Parameters**:
- `limit`: Number of items per page (default: 100, max: 100)
- `offset`: Number of items to skip (default: 0)

**Example**:
```
GET /api/messages/module/1?limit=20&offset=40
```

---

## Health Checks

### API Gateway Health

**Endpoint**: `GET /health`

**Response**: `200 OK`
```json
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

### Individual Service Health

Each service also exposes its own health endpoint:
- Auth Service: `GET http://localhost:8001/health`
- Messaging Service: `GET http://localhost:8002/health`
- Module Service: `GET http://localhost:8003/health`
- Admin Service: `GET http://localhost:8004/health`

---

## Postman Collection

Import the Postman collection for easy API testing:

[Download ModNet.postman_collection.json](../postman/ModNet.postman_collection.json)

---

## Example Usage

### Complete User Flow

```bash
# 1. Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","displayName":"Test User"}'

# 2. Login
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}' \
  | jq -r '.token')

# 3. Get modules
curl http://localhost:8000/api/modules \
  -H "Authorization: Bearer $TOKEN"

# 4. Enroll in module
curl -X POST http://localhost:8000/api/modules/1/enroll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":1}'

# 5. Send message
curl -X POST http://localhost:8000/api/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello!","senderId":1,"moduleId":1}'

# 6. Get messages
curl http://localhost:8000/api/messages/module/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

For more information, see:
- [Architecture Documentation](MICROSERVICES_ARCHITECTURE.md)
- [Quick Start Guide](QUICKSTART.md)
- [Integration Test Plan](INTEGRATION_TEST_PLAN.md)
