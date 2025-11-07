# ModNet

ModNet is a PWA that connects university students through module-based communities. Students sign up with their university email, join their course modules, and collaborate via discussions and shared resources.

## Architecture

ModNet has been refactored into a **microservices architecture** for improved scalability, maintainability, and independent deployment capabilities.

- **Frontend**: React PWA with Vite, TailwindCSS, shadcn/ui
- **Backend**: Microservices architecture with Node.js/Express
- **Database**: Supabase (PostgreSQL)
- **Infrastructure**: Docker, Docker Compose, GitHub Actions CI/CD

## Services

### API Gateway (Port 8000)
Central entry point for all client requests. Handles routing, rate limiting, and CORS.

### Auth Service (Port 8001)
User authentication, registration, session management, and profile operations.

### Messaging Service (Port 8002)
Real-time chat, message persistence, and chat history management.

### Module Service (Port 8003)
Module and course management, user enrollment operations.

### Admin Service (Port 8004)
Administrative operations, content moderation, dashboard data.

## Getting Started

### Prerequisites
- Node.js 20 or higher
- Docker and Docker Compose (for containerized deployment)
- Supabase account and project

### Local Development

#### 1. Clone the repository
```bash
git clone https://github.com/Abhiram2144/ModNet.git
cd ModNet
```

#### 2. Set up environment variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Supabase credentials and secrets
```

#### 3. Install dependencies for all services
```bash
# Install client dependencies
cd client && npm install

# Install service dependencies
cd ../services/auth-service && npm install
cd ../messaging-service && npm install
cd ../module-service && npm install
cd ../admin-service && npm install
cd ../api-gateway && npm install
```

#### 4. Start services

**Option A: Using Docker Compose (Recommended)**
```bash
# From the root directory
docker-compose up
```

**Option B: Manual start (for development)**
```bash
# Terminal 1 - Auth Service
cd services/auth-service && npm run dev

# Terminal 2 - Messaging Service
cd services/messaging-service && npm run dev

# Terminal 3 - Module Service
cd services/module-service && npm run dev

# Terminal 4 - Admin Service
cd services/admin-service && npm run dev

# Terminal 5 - API Gateway
cd services/api-gateway && npm run dev

# Terminal 6 - Client
cd client && npm run dev
```

#### 5. Access the application
- **Client**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **Auth Service**: http://localhost:8001
- **Messaging Service**: http://localhost:8002
- **Module Service**: http://localhost:8003
- **Admin Service**: http://localhost:8004

## Documentation

- [Microservices Architecture](docs/MICROSERVICES_ARCHITECTURE.md)
- [Figma Design](https://www.figma.com/design/7RV85A9m5O8JYLWkfeo12Y/ModNet?t=6NtcF61aM5IbUcux-0)

## Project Structure

```
ModNet/
├── client/                 # React PWA frontend
├── services/              # Microservices
│   ├── auth-service/     # Authentication service
│   ├── messaging-service/ # Messaging service
│   ├── module-service/   # Module management service
│   ├── admin-service/    # Admin operations service
│   └── api-gateway/      # API Gateway
├── docs/                  # Documentation
├── .github/workflows/    # CI/CD pipelines
├── docker-compose.yml    # Docker orchestration
└── .env.example         # Environment variables template
```

## Development

### Running Tests
```bash
# Test all services
npm test

# Test specific service
cd services/auth-service && npm test
```

### Linting
```bash
# Client
cd client && npm run lint

# Services (add linting to each service as needed)
```

### Building
```bash
# Build client
cd client && npm run build

# Build all services with Docker
docker-compose build
```

## Deployment

### Docker Deployment
```bash
# Build and deploy all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### CI/CD
GitHub Actions workflows automatically:
- Run tests on pull requests
- Build Docker images on merge to main
- Deploy to production environment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

