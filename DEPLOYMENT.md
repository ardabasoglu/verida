# Verida Kurumsal Bilgi Uygulaması - Deployment Guide

## 🚀 Production Deployment Checklist

### Pre-Deployment Requirements

- [ ] **Environment Configuration**
  - [ ] Copy `.env.production` and update all values
  - [ ] Set secure `NEXTAUTH_SECRET` (64+ characters)
  - [ ] Configure PostgreSQL database URL
  - [ ] Set up email SMTP configuration
  - [ ] Configure file upload directory

- [ ] **Infrastructure Setup**
  - [ ] PostgreSQL database server
  - [ ] File storage volume (Coolify)
  - [ ] SSL certificate for HTTPS
  - [ ] Domain name configuration

- [ ] **Security Configuration**
  - [ ] Firewall rules configured
  - [ ] Database access restricted
  - [ ] HTTPS enforced
  - [ ] Security headers enabled

### Quick Deployment (Coolify)

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd verida
   ```

2. **Configure Environment**
   ```bash
   cp .env.production .env.local
   # Edit .env.local with your production values
   ```

3. **Run Integration Tests**
   ```bash
   npm run test:integration
   ```

4. **Deploy to Coolify**
   ```bash
   npm run deploy
   ```

### Manual Deployment Steps

#### 1. Environment Setup

```bash
# Copy and configure environment
cp .env.production .env.local
nano .env.local

# Required environment variables:
DATABASE_URL="postgresql://user:pass@host:5432/verida_prod"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-64-character-secret"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_FROM="noreply@dgmgumruk.com"
```

#### 2. Database Setup

```bash
# Install dependencies
npm ci --only=production

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate:prod

# Seed initial data (optional)
npm run db:seed
```

#### 3. Build Application

```bash
# Build for production
npm run build:prod

# Test the build
npm run start:prod
```

#### 4. Health Check

```bash
# Verify deployment
npm run health:check

# Or manually check
curl -f http://localhost:3000/api/health
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start services
docker-compose up -d --build

# Check logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Using Dockerfile

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

## ☁️ Coolify Platform Deployment

### 1. Coolify Configuration

The application includes a `coolify.yaml` configuration file that defines:

- **Application Service**: Next.js application with health checks
- **Database Service**: PostgreSQL with persistent storage
- **Volumes**: File uploads and logs
- **Networks**: Secure internal communication

### 2. Environment Variables in Coolify

Set these environment variables in your Coolify dashboard:

```env
DATABASE_URL=postgresql://verida_user:secure_password@postgres:5432/verida_prod
NEXTAUTH_URL=https://your-app.coolify.io
NEXTAUTH_SECRET=your-super-secure-64-character-secret
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@dgmgumruk.com
POSTGRES_PASSWORD=secure_database_password
```

### 3. Volume Configuration

Coolify will automatically create and manage:
- **uploads**: `/app/uploads` - File storage
- **logs**: `/app/logs` - Application logs
- **postgres_data**: Database persistence

### 4. Health Monitoring

The application includes comprehensive health checks:
- Database connectivity
- File system access
- Memory usage monitoring
- Environment validation

Access health status at: `https://your-app.coolify.io/api/health`

## 🔧 Production Configuration

### Security Headers

The application automatically sets security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS only)
- `Referrer-Policy: strict-origin-when-cross-origin`

### Performance Optimizations

- **Database Indexes**: Optimized queries with performance indexes
- **Image Optimization**: WebP and AVIF format support
- **Compression**: Gzip compression enabled
- **Caching**: Static asset caching
- **Bundle Optimization**: Tree shaking and code splitting

### Monitoring and Logging

- **Health Endpoint**: `/api/health` with detailed system status
- **Error Tracking**: Comprehensive error handling and logging
- **Performance Metrics**: Memory and CPU usage monitoring
- **Activity Logging**: User action audit trail

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database status
docker-compose logs postgres

# Test connection manually
psql -h localhost -U verida_user -d verida_prod
```

#### Application Won't Start
```bash
# Check application logs
docker-compose logs app

# Verify environment variables
npm run test:integration
```

#### File Upload Issues
```bash
# Check upload directory permissions
ls -la uploads/

# Test file system access
npm run health:check
```

#### Memory Issues
```bash
# Monitor memory usage
docker stats

# Check health endpoint
curl http://localhost:3000/api/health
```

### Health Check Responses

**Healthy System:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": { "status": "pass" },
    "filesystem": { "status": "pass" },
    "memory": { "status": "pass" },
    "environment": { "status": "pass" }
  }
}
```

**Degraded System:**
```json
{
  "status": "degraded",
  "checks": {
    "memory": { 
      "status": "warn", 
      "message": "High memory usage detected" 
    }
  }
}
```

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
psql -h localhost -U verida_user -d verida_prod < backup.sql

# Reset and reseed
npm run db:reset
npm run db:seed
```

#### Application Recovery
```bash
# Restart services
docker-compose restart app

# Or rebuild if needed
docker-compose up -d --build app
```

## 📊 Performance Monitoring

### Key Metrics to Monitor

- **Response Time**: API endpoints should respond < 500ms
- **Memory Usage**: Should stay below 512MB RSS
- **Database Queries**: Monitor slow queries (> 1000ms)
- **File Storage**: Monitor disk usage in uploads directory
- **Error Rate**: Should be < 1% of total requests

### Monitoring Tools

- **Health Endpoint**: Built-in system health monitoring
- **Database Metrics**: PostgreSQL performance stats
- **Application Logs**: Structured logging with timestamps
- **Resource Usage**: Memory and CPU monitoring

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm ci --only=production

# Run migrations
npm run db:migrate:prod

# Build and restart
npm run build:prod
docker-compose restart app
```

### Database Maintenance

```bash
# Create backup
pg_dump -h localhost -U verida_user verida_prod > backup.sql

# Analyze database performance
npm run db:studio

# Optimize database
ANALYZE;
VACUUM;
```

### Log Management

```bash
# View application logs
docker-compose logs -f app

# Rotate logs (if needed)
logrotate /app/logs/app.log
```

## 📞 Support

For deployment issues or questions:

1. Check the health endpoint: `/api/health`
2. Review application logs
3. Run integration tests: `npm run test:integration`
4. Consult this deployment guide
5. Check the troubleshooting section

## 🎯 Success Criteria

Deployment is successful when:

- [ ] Health endpoint returns `"status": "healthy"`
- [ ] All integration tests pass
- [ ] Application is accessible via HTTPS
- [ ] User authentication works with @dgmgumruk.com emails
- [ ] File uploads function correctly
- [ ] Database operations complete successfully
- [ ] Security headers are present
- [ ] Performance metrics are within acceptable ranges

---

**🎉 Congratulations! Your Verida Kurumsal Bilgi Uygulaması is now deployed and ready for production use.**