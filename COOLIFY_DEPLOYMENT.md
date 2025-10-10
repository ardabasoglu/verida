# Coolify Deployment Guide

## Problem Solved
Fixed the deployment issue where the build process was trying to access database tables that didn't exist yet. The database setup now happens at runtime, not during build.

## Changes Made

### 1. Separated Build and Runtime Database Operations

**Before:**
- Build script tried to generate Prisma client and access database
- Health checks failed during build when database wasn't available

**After:**
- Build phase: Only generates Prisma client (gracefully handles failures)
- Runtime phase: Sets up database schema, indexes, and starts application

### 2. Updated Scripts

**package.json changes:**
- `build`: Removed database dependency
- `build:coolify`: New build script for Coolify
- `db:generate:safe`: Safe Prisma client generation
- `db:setup:prod`: Combined database setup for runtime

**New files:**
- `build.sh`: Coolify build script (no database required)
- `start.sh`: Updated startup script with database setup

### 3. Made Health Checks Build-Safe

- Health API now gracefully handles missing database during build
- Database health check skips when DATABASE_URL is not available
- Build-time database failures are treated as warnings, not errors

## Coolify Configuration

### Build Command
```bash
./build.sh
```

### Start Command
```bash
./start.sh
```

### Required Environment Variables
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/verida_prod
NEXTAUTH_URL=https://your-app.coolify.io
NEXTAUTH_SECRET=your-64-character-secret-key
EMAIL_FROM=noreply@dgmgumruk.com
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
```

### Optional Environment Variables
```env
SEED_DATABASE=true  # Set to seed database on startup
NODE_ENV=production
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

## Deployment Process

1. **Build Phase** (runs on Coolify build server):
   - Install dependencies
   - Generate Prisma client (without database connection)
   - Build Next.js application
   - No database access required

2. **Runtime Phase** (runs on Coolify app server):
   - Validate environment variables
   - Wait for database to be ready
   - Generate Prisma client
   - Push database schema
   - Apply performance indexes
   - Optional: Seed database
   - Start Next.js server

## Testing the Deployment

### Local Testing
```bash
# Test build without database
./build.sh

# Test startup with database
./start.sh
```

### Health Check
Once deployed, check application health:
```bash
curl https://your-app.coolify.io/api/health
```

Expected response:
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

## Troubleshooting

### Build Fails
- Check if `build.sh` has execute permissions: `chmod +x build.sh`
- Verify Node.js version is 22.x
- Check build logs for specific errors

### App Won't Start
- Verify all required environment variables are set
- Check database connectivity
- Review startup logs: `./start.sh`

### Database Issues
- Ensure PostgreSQL is running and accessible
- Verify DATABASE_URL format
- Check database permissions

### Performance Issues
- Monitor `/api/health` endpoint
- Check memory usage in health response
- Review database query performance

## Success Indicators

✅ Build completes without database errors
✅ Application starts successfully
✅ Health endpoint returns "healthy" status
✅ Database schema is created and indexed
✅ User authentication works
✅ File uploads function correctly

The deployment is now database-agnostic during build and handles all database setup at runtime, making it perfect for Coolify's deployment model.