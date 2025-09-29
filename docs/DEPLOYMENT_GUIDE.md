# Deployment Guide

## Overview

Verida Kurumsal Bilgi Uygulaması deployment rehberi. Bu dokümanda Coolify platformu ve diğer deployment seçenekleri açıklanmıştır.

## Coolify Deployment (Önerilen)

### Prerequisites
- Coolify instance kurulu ve çalışır durumda
- PostgreSQL database erişimi
- Domain name (opsiyonel)

### 1. Repository Bağlantısı
```bash
# Coolify dashboard'da yeni proje oluşturun
# Git repository URL'ini ekleyin
# Branch: main
# Build command: npm run build
# Start command: npm start
```

### 2. Environment Variables
Coolify dashboard'da aşağıdaki environment variable'ları ekleyin:

```env
# Database
DATABASE_URL=postgresql://username:password@host:5432/verida_prod

# NextAuth.js
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-production-key

# Email (Opsiyonel)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@dgmgumruk.com

# Node.js
NODE_ENV=production
```

### 3. Database Setup
```bash
# Production database oluşturun
createdb verida_prod

# Migration'ları uygulayın
npm run db:migrate

# İlk admin kullanıcısını oluşturun (opsiyonel)
npm run db:seed
```

### 4. Volume Configuration
```yaml
# Coolify volume mapping
volumes:
  - ./uploads:/app/public/uploads
  - ./logs:/app/logs
```

### 5. Health Check
```yaml
# Coolify health check
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/verida
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-key
    depends_on:
      - db
    volumes:
      - ./uploads:/app/public/uploads
      - ./logs:/app/logs

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=verida
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Manual Server Deployment

### Server Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB önerilir)
- **Storage**: 50GB+ SSD
- **Network**: 1Gbps bağlantı

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

### 2. Database Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE verida_prod;
CREATE USER verida_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE verida_prod TO verida_user;
\q
```

### 3. Application Deployment
```bash
# Clone repository
git clone <repository-url> /var/www/verida
cd /var/www/verida

# Install dependencies
npm ci --only=production

# Set environment variables
cp .env.example .env.production
nano .env.production

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Start with PM2
pm2 start npm --name "verida" -- start
pm2 save
pm2 startup
```

### 4. Nginx Configuration
```nginx
# /etc/nginx/sites-available/verida
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File upload size limit
    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/verida /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/verida_dev
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key
```

### Staging
```env
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db:5432/verida_staging
NEXTAUTH_URL=https://staging.your-domain.com
NEXTAUTH_SECRET=staging-secret-key
```

### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod-db:5432/verida_prod
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=super-secure-production-key
```

## Security Checklist

### Pre-Deployment
- [ ] Environment variables güvenli
- [ ] Database credentials güçlü
- [ ] NEXTAUTH_SECRET rastgele ve güçlü
- [ ] HTTPS yapılandırılmış
- [ ] Firewall kuralları ayarlanmış

### Post-Deployment
- [ ] Health check endpoint çalışıyor
- [ ] Database bağlantısı başarılı
- [ ] Authentication flow test edildi
- [ ] File upload çalışıyor
- [ ] Logs düzgün yazılıyor

## Monitoring & Maintenance

### Health Monitoring
```bash
# Health check script
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ $response != "200" ]; then
    echo "Application is down! Response code: $response"
    # Send alert
fi
```

### Log Management
```bash
# PM2 logs
pm2 logs verida

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f logs/app.log
```

### Database Backup
```bash
#!/bin/bash
# Backup script
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U verida_user verida_prod > backup_$DATE.sql

# Keep only last 7 days
find . -name "backup_*.sql" -mtime +7 -delete
```

### Auto-Deployment Script
```bash
#!/bin/bash
# deploy.sh
cd /var/www/verida

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --only=production

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Restart application
pm2 restart verida

echo "Deployment completed successfully!"
```

## Performance Optimization

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_pages_author ON pages(authorId);
CREATE INDEX CONCURRENTLY idx_pages_published ON pages(published);
```

### Nginx Caching
```nginx
# Static file caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### PM2 Cluster Mode
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'verida',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

## Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U verida_user -d verida_prod

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### Application Won't Start
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs verida

# Restart application
pm2 restart verida
```

#### High Memory Usage
```bash
# Check memory usage
free -h
pm2 monit

# Restart if needed
pm2 restart verida
```

### Rollback Procedure
```bash
#!/bin/bash
# rollback.sh
cd /var/www/verida

# Revert to previous commit
git reset --hard HEAD~1

# Reinstall dependencies
npm ci --only=production

# Rebuild
npm run build

# Restart
pm2 restart verida

echo "Rollback completed!"
```

## Scaling Considerations

### Horizontal Scaling
- Load balancer (Nginx/HAProxy)
- Multiple application instances
- Database read replicas
- CDN for static assets

### Vertical Scaling
- Increase server resources
- Database performance tuning
- Connection pooling optimization
- Memory cache implementation

Bu deployment rehberi ile Verida uygulamasını güvenli ve performanslı bir şekilde production ortamına deploy edebilirsiniz.