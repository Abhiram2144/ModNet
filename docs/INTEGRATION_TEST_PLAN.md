# Integration Test Plan for ModNet Microservices

## Overview

This document outlines the integration testing strategy for ModNet's microservices architecture.

## Test Objectives

1. Verify inter-service communication
2. Validate API Gateway routing
3. Test end-to-end workflows
4. Ensure data consistency across services
5. Validate error handling and resilience

## Test Environment Setup

### Prerequisites
```bash
# Start all services with docker-compose
docker-compose up -d

# Wait for services to be healthy
./scripts/wait-for-services.sh
```

### Environment Variables
```bash
export API_GATEWAY_URL=http://localhost:8000
export TEST_USER_EMAIL=test@example.com
export TEST_USER_PASSWORD=testpassword123
export TEST_ADMIN_EMAIL=admin@example.com
export TEST_ADMIN_PASSWORD=adminpassword123
```

## Test Scenarios

### 1. Authentication Flow (Auth Service)

#### Test 1.1: User Registration
```bash
# Request
POST $API_GATEWAY_URL/api/auth/register
{
  "email": "newuser@example.com",
  "password": "password123",
  "displayName": "Test User"
}

# Expected Response: 201 Created
{
  "user": { "id": "...", "email": "..." },
  "profile": { "id": "...", "displayname": "Test User" }
}
```

#### Test 1.2: User Login
```bash
# Request
POST $API_GATEWAY_URL/api/auth/login
{
  "email": "newuser@example.com",
  "password": "password123"
}

# Expected Response: 200 OK
{
  "user": { ... },
  "session": { ... },
  "profile": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Test 1.3: Get User Profile
```bash
# Request
GET $API_GATEWAY_URL/api/auth/profile/{userId}
Authorization: Bearer {token}

# Expected Response: 200 OK
{
  "id": "...",
  "displayname": "Test User",
  "email": "newuser@example.com",
  ...
}
```

#### Test 1.4: Update Profile
```bash
# Request
PUT $API_GATEWAY_URL/api/auth/profile/{userId}
Authorization: Bearer {token}
{
  "displayname": "Updated Name"
}

# Expected Response: 200 OK
```

### 2. Module Management (Module Service)

#### Test 2.1: Get All Modules
```bash
# Request
GET $API_GATEWAY_URL/api/modules

# Expected Response: 200 OK
[
  {
    "id": "1",
    "name": "Introduction to Computer Science",
    "code": "CS101",
    ...
  }
]
```

#### Test 2.2: Enroll in Module
```bash
# Request
POST $API_GATEWAY_URL/api/modules/{moduleId}/enroll
Authorization: Bearer {token}
{
  "userId": "{studentId}"
}

# Expected Response: 201 Created
```

#### Test 2.3: Get User Modules
```bash
# Request
GET $API_GATEWAY_URL/api/modules/user/{userId}
Authorization: Bearer {token}

# Expected Response: 200 OK
[
  {
    "id": "1",
    "name": "Introduction to Computer Science",
    "code": "CS101"
  }
]
```

### 3. Messaging Flow (Messaging Service)

#### Test 3.1: Send Message to Module
```bash
# Request
POST $API_GATEWAY_URL/api/messages
Authorization: Bearer {token}
{
  "content": "Hello, this is a test message",
  "senderId": "{studentId}",
  "moduleId": "{moduleId}"
}

# Expected Response: 201 Created
{
  "id": "...",
  "content": "Hello, this is a test message",
  "senderid": "...",
  "moduleid": "...",
  "createdat": "..."
}
```

#### Test 3.2: Get Module Messages
```bash
# Request
GET $API_GATEWAY_URL/api/messages/module/{moduleId}
Authorization: Bearer {token}

# Expected Response: 200 OK
[
  {
    "id": "...",
    "content": "Hello, this is a test message",
    "students": {
      "displayname": "Test User",
      "profileimage": "..."
    },
    ...
  }
]
```

#### Test 3.3: Update Message
```bash
# Request
PUT $API_GATEWAY_URL/api/messages/{messageId}
Authorization: Bearer {token}
{
  "senderId": "{studentId}",
  "content": "Updated message content"
}

# Expected Response: 200 OK
```

#### Test 3.4: Delete Message
```bash
# Request
DELETE $API_GATEWAY_URL/api/messages/{messageId}
Authorization: Bearer {token}
{
  "senderId": "{studentId}"
}

# Expected Response: 200 OK
```

### 4. Admin Operations (Admin Service)

#### Test 4.1: Admin Login
```bash
# Request
POST $API_GATEWAY_URL/api/admin/login
{
  "email": "admin@example.com",
  "password": "{ADMIN_PASSWORD}"
}

# Expected Response: 200 OK
{
  "success": true,
  "email": "admin@example.com",
  "role": "admin"
}
```

#### Test 4.2: Get All Channels
```bash
# Request
GET $API_GATEWAY_URL/api/admin/channels
Authorization: Bearer {admin_token}

# Expected Response: 200 OK
[
  {
    "id": "1",
    "name": "General",
    "description": "General discussion"
  }
]
```

#### Test 4.3: Create Channel
```bash
# Request
POST $API_GATEWAY_URL/api/admin/channels
Authorization: Bearer {admin_token}
{
  "name": "Study Group",
  "description": "Collaborative study discussions"
}

# Expected Response: 201 Created
```

#### Test 4.4: Get All Users
```bash
# Request
GET $API_GATEWAY_URL/api/admin/users
Authorization: Bearer {admin_token}

# Expected Response: 200 OK
[
  {
    "id": "1",
    "displayname": "Test User",
    "email": "test@example.com",
    ...
  }
]
```

### 5. API Gateway Tests

#### Test 5.1: Health Check Aggregation
```bash
# Request
GET $API_GATEWAY_URL/health

# Expected Response: 200 OK
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

#### Test 5.2: Rate Limiting
```bash
# Send 101 requests in quick succession
for i in {1..101}; do
  curl $API_GATEWAY_URL/api/modules
done

# Expected: First 100 succeed, 101st returns 429 Too Many Requests
```

#### Test 5.3: CORS Headers
```bash
# Request with Origin header
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     $API_GATEWAY_URL/api/auth/login

# Expected: CORS headers in response
```

### 6. End-to-End Workflows

#### Workflow 6.1: Complete User Journey
```
1. Register new user (Auth Service)
2. Login user (Auth Service)
3. Get available modules (Module Service)
4. Enroll in a module (Module Service)
5. Send message to module (Messaging Service)
6. Get module messages (Messaging Service)
7. Update user profile (Auth Service)
8. Logout (Auth Service)
```

#### Workflow 6.2: Admin Management Journey
```
1. Admin login (Admin Service)
2. View all users (Admin Service)
3. Create new channel (Admin Service)
4. Create new course (Admin Service)
5. View all modules (Module Service via Admin)
6. Update channel details (Admin Service)
```

## Error Handling Tests

### Test 7.1: Invalid Credentials
```bash
POST $API_GATEWAY_URL/api/auth/login
{
  "email": "invalid@example.com",
  "password": "wrongpassword"
}

# Expected: 401 Unauthorized
```

### Test 7.2: Unauthorized Access
```bash
GET $API_GATEWAY_URL/api/admin/users
# No Authorization header

# Expected: 401 Unauthorized
```

### Test 7.3: Service Unavailable
```bash
# Stop one service
docker-compose stop auth-service

# Try to access auth endpoint
GET $API_GATEWAY_URL/api/auth/session

# Expected: 503 Service Unavailable
```

### Test 7.4: Invalid Request Data
```bash
POST $API_GATEWAY_URL/api/messages
{
  "content": "",  # Empty content
  "senderId": ""   # Empty sender
}

# Expected: 400 Bad Request
```

## Performance Tests

### Test 8.1: Concurrent Requests
```bash
# Use Apache Bench or similar tool
ab -n 1000 -c 10 $API_GATEWAY_URL/api/modules

# Expected: All requests succeed, avg response time < 200ms
```

### Test 8.2: Large Message Volume
```bash
# Send 100 messages in rapid succession
for i in {1..100}; do
  curl -X POST $API_GATEWAY_URL/api/messages \
       -H "Authorization: Bearer $TOKEN" \
       -d "{\"content\":\"Message $i\",\"senderId\":\"$STUDENT_ID\",\"moduleId\":\"$MODULE_ID\"}"
done

# Expected: All messages stored successfully
```

## Data Consistency Tests

### Test 9.1: Cross-Service Data Integrity
```bash
# 1. Create user via Auth Service
# 2. Verify user appears in Admin Service user list
# 3. Enroll user in module via Module Service
# 4. Verify enrollment via Auth Service (user modules endpoint)
```

### Test 9.2: Cascading Updates
```bash
# 1. Update user profile (Auth Service)
# 2. Send message (Messaging Service)
# 3. Verify message shows updated profile data
```

## Automated Testing Scripts

### Sample Test Script (Node.js)
```javascript
// tests/integration/auth.test.js
const axios = require('axios');
const API_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';

describe('Auth Service Integration Tests', () => {
  let authToken;
  let userId;

  test('User Registration', async () => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    });
    
    expect(response.status).toBe(201);
    expect(response.data.user).toBeDefined();
    expect(response.data.profile).toBeDefined();
    userId = response.data.user.id;
  });

  test('User Login', async () => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(response.status).toBe(200);
    expect(response.data.token).toBeDefined();
    authToken = response.data.token;
  });

  test('Get Profile', async () => {
    const response = await axios.get(`${API_URL}/api/auth/profile/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.displayname).toBe('Test User');
  });
});
```

## Test Execution

### Manual Testing
```bash
# Run all integration tests
./scripts/run-integration-tests.sh

# Run specific service tests
./scripts/run-integration-tests.sh auth
./scripts/run-integration-tests.sh messaging
```

### Automated Testing
```bash
# Using npm scripts
npm run test:integration

# Using Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Success Criteria

✅ All services respond to health checks
✅ API Gateway successfully routes to all services
✅ User can register, login, and access protected resources
✅ Messages can be sent and retrieved
✅ Modules can be enrolled and listed
✅ Admin operations work correctly
✅ Error handling is graceful and consistent
✅ Rate limiting works as expected
✅ CORS is properly configured
✅ All end-to-end workflows complete successfully

## Monitoring During Tests

```bash
# Monitor service logs
docker-compose logs -f

# Monitor specific service
docker-compose logs -f auth-service

# Check service health
watch -n 5 'curl -s http://localhost:8000/health | jq'
```

## Cleanup

```bash
# After tests, clean up test data
./scripts/cleanup-test-data.sh

# Stop all services
docker-compose down

# Remove volumes (careful!)
docker-compose down -v
```

## Continuous Integration

Add to GitHub Actions workflow:
```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start services
        run: docker-compose up -d
      - name: Wait for services
        run: ./scripts/wait-for-services.sh
      - name: Run integration tests
        run: npm run test:integration
      - name: Tear down
        run: docker-compose down
```

## Reporting

After test execution, generate reports:
- Test coverage report
- Performance metrics
- Error logs
- Success/failure rates
- Response time statistics
