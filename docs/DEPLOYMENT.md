# ModNet Deployment Guide

This guide covers deploying ModNet's microservices architecture to various platforms.

## Prerequisites

- Docker and Docker Compose installed
- Supabase project set up
- Environment variables configured
- CI/CD secrets configured in GitHub

## Environment Variables

Each service requires specific environment variables. Ensure you have:

### Global Variables (shared across services)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET=your_secure_jwt_secret
```

### Service-Specific Variables
See each service's `.env.example` file for additional requirements.

## Local Development Deployment

### Using Docker Compose

1. **Set up environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Build and start all services**:
   ```bash
   docker-compose up --build
   ```

3. **Verify services are running**:
   ```bash
   # Check API Gateway health
   curl http://localhost:8000/health
   ```

4. **View logs**:
   ```bash
   docker-compose logs -f
   ```

5. **Stop services**:
   ```bash
   docker-compose down
   ```

## Production Deployment Options

### Option 1: Deploy to Render

#### 1. Auth Service
```bash
# In Render dashboard:
# - Create new Web Service
# - Connect GitHub repository
# - Root Directory: services/auth-service
# - Build Command: npm install
# - Start Command: npm start
# - Add environment variables
```

#### 2. Repeat for each service
Create separate web services for:
- Messaging Service
- Module Service  
- Admin Service
- API Gateway

#### 3. Client (Frontend)
```bash
# Create Static Site
# - Root Directory: client
# - Build Command: npm run build
# - Publish Directory: dist
# - Add environment variable: VITE_API_GATEWAY_URL
```

### Option 2: Deploy to Fly.io

#### 1. Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

#### 2. Login to Fly
```bash
fly auth login
```

#### 3. Deploy each service
```bash
# Auth Service
cd services/auth-service
fly launch --name modnet-auth-service
fly secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=... JWT_SECRET=...
fly deploy

# Messaging Service
cd ../messaging-service
fly launch --name modnet-messaging-service
fly secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=...
fly deploy

# Repeat for other services
```

#### 4. Deploy API Gateway
```bash
cd services/api-gateway
fly launch --name modnet-api-gateway
fly secrets set \
  AUTH_SERVICE_URL=https://modnet-auth-service.fly.dev \
  MESSAGING_SERVICE_URL=https://modnet-messaging-service.fly.dev \
  MODULE_SERVICE_URL=https://modnet-module-service.fly.dev \
  ADMIN_SERVICE_URL=https://modnet-admin-service.fly.dev \
  JWT_SECRET=...
fly deploy
```

### Option 3: Deploy to AWS ECS

#### 1. Build and push Docker images to ECR
```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build and push each service
docker build -t modnet-auth-service services/auth-service
docker tag modnet-auth-service:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/modnet-auth-service:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/modnet-auth-service:latest

# Repeat for other services
```

#### 2. Create ECS Task Definitions
Create task definitions for each service with:
- Container configuration
- Environment variables
- Port mappings
- Health checks

#### 3. Create ECS Services
Create an ECS service for each microservice with:
- Auto-scaling configuration
- Load balancer settings
- Desired task count

#### 4. Configure Application Load Balancer
Set up ALB to route traffic to appropriate services.

### Option 4: Deploy to Railway

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. Login and initialize
```bash
railway login
railway init
```

#### 3. Deploy each service
```bash
# Auth Service
cd services/auth-service
railway up
railway variables set SUPABASE_URL=... SUPABASE_ANON_KEY=... JWT_SECRET=...

# Repeat for other services
```

## GitHub Actions CI/CD

The repository includes GitHub Actions workflows for automated deployment.

### Setup GitHub Secrets

Add the following secrets to your GitHub repository:

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
JWT_SECRET
ADMIN_PASSWORD
RENDER_API_KEY (if deploying to Render)
FLY_API_TOKEN (if deploying to Fly.io)
AWS_ACCESS_KEY_ID (if deploying to AWS)
AWS_SECRET_ACCESS_KEY (if deploying to AWS)
```

### Workflow Triggers

- **Push to main branch**: Builds, tests, and deploys to production
- **Pull requests**: Runs tests only
- **Path filters**: Only affected services are rebuilt

## Monitoring and Health Checks

### Health Check Endpoints

Each service exposes a health check endpoint:

```bash
# API Gateway
curl http://localhost:8000/health

# Auth Service
curl http://localhost:8001/health

# Messaging Service
curl http://localhost:8002/health

# Module Service
curl http://localhost:8003/health

# Admin Service
curl http://localhost:8004/health
```

### Monitoring Setup

#### Option 1: Supabase Logs
Monitor database queries and errors through Supabase dashboard.

#### Option 2: Docker Logs
```bash
# View logs for specific service
docker-compose logs -f auth-service

# View all logs
docker-compose logs -f
```

#### Option 3: Third-party Monitoring
Consider integrating:
- Datadog
- New Relic
- Sentry for error tracking
- Prometheus + Grafana for metrics

## Scaling

### Horizontal Scaling

Each service can be scaled independently:

```bash
# Docker Compose
docker-compose up --scale auth-service=3 --scale messaging-service=5

# Fly.io
fly scale count 3 -a modnet-auth-service

# AWS ECS
aws ecs update-service --service modnet-auth-service --desired-count 3
```

### Database Scaling

For high traffic:
1. Enable Supabase connection pooling
2. Set up read replicas
3. Implement caching layer (Redis)
4. Use database indexes appropriately

## Troubleshooting

### Service won't start
- Check environment variables are set correctly
- Verify Supabase credentials
- Check service logs: `docker-compose logs service-name`

### Database connection errors
- Verify SUPABASE_URL and keys
- Check network connectivity
- Review Supabase dashboard for errors

### CORS errors
- Verify API Gateway CORS configuration
- Check allowed origins in production

### Authentication failures
- Ensure JWT_SECRET matches across services
- Verify Supabase Auth is configured correctly

## Rollback Procedure

### Docker Deployment
```bash
# Stop current deployment
docker-compose down

# Switch to previous version
git checkout previous-commit-sha

# Rebuild and deploy
docker-compose up --build -d
```

### Platform-specific
Each platform has its own rollback mechanism:
- **Render**: Use dashboard to select previous deployment
- **Fly.io**: `fly releases` and `fly deploy --image=...`
- **AWS ECS**: Update service with previous task definition

## Security Checklist

- [ ] All environment variables secured
- [ ] HTTPS enabled for all services
- [ ] Rate limiting configured in API Gateway
- [ ] Database Row Level Security (RLS) enabled
- [ ] JWT secrets rotated regularly
- [ ] Service-to-service authentication implemented
- [ ] CORS properly configured
- [ ] API endpoints authenticated
- [ ] Input validation on all endpoints
- [ ] SQL injection protection enabled

## Performance Optimization

1. **Enable caching** at API Gateway level
2. **Database indexing** on frequently queried columns
3. **Connection pooling** for database connections
4. **CDN** for static assets
5. **Lazy loading** in frontend
6. **Code splitting** in React app
7. **Compression** middleware in services

## Backup and Recovery

### Database Backups
- Supabase provides automatic daily backups
- Configure point-in-time recovery in Supabase dashboard
- Export critical data regularly

### Service Configuration Backups
- Store all environment variables securely (1Password, AWS Secrets Manager)
- Version control all configuration files
- Document deployment procedures

## Cost Optimization

1. **Right-size containers**: Use appropriate resources per service
2. **Auto-scaling**: Scale down during low traffic
3. **Supabase tier**: Choose appropriate plan
4. **CDN**: Reduce bandwidth costs
5. **Monitoring**: Track and optimize expensive operations

## Support

For deployment issues:
1. Check service logs
2. Review health check endpoints
3. Consult platform documentation
4. Open GitHub issue for bugs
