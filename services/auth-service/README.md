# Auth Service

Authentication and user profile management service for ModNet.

## Features

- User login and registration
- Session management
- User profile CRUD operations
- JWT token generation
- Integration with Supabase Auth

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/session` - Get current session

### Profile
- `GET /auth/profile/:userId` - Get user profile
- `PUT /auth/profile/:userId` - Update user profile

### Modules
- `GET /auth/modules/:studentId` - Get user's enrolled modules

### Health
- `GET /health` - Health check endpoint

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
PORT=8001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret_key
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Docker

```bash
# Build image
docker build -t auth-service .

# Run container
docker run -p 8001:8001 --env-file .env auth-service
```

## Testing

```bash
# Run tests
npm test
```

## Database Tables

This service interacts with the following Supabase tables:
- `students` - User profile data
- `user_modules` - User module enrollments
- Supabase Auth tables
