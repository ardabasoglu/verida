# Database Setup Guide

This document explains how to set up the PostgreSQL database for the Verida Kurumsal Bilgi Uygulaması.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 18+ installed
- npm or yarn package manager

## Quick Setup

1. **Run the setup script:**
   ```bash
   ./scripts/setup-db.sh
   ```

2. **Apply database migrations:**
   ```bash
   npm run db:migrate
   ```

3. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

## Manual Setup

If you prefer to set up the database manually:

### 1. Create Database and User

```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create user
CREATE USER verida_user WITH PASSWORD 'verida_password';

-- Create database
CREATE DATABASE verida_kurumsal_db OWNER verida_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE verida_kurumsal_db TO verida_user;

-- Exit PostgreSQL
\q
```

### 2. Update Environment Variables

Update your `.env.local` file:

```env
DATABASE_URL="postgresql://verida_user:verida_password@localhost:5432/verida_kurumsal_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 3. Run Migrations

```bash
npm run db:migrate
```

## Database Schema

The database includes the following main models:

- **User**: User accounts with role-based access control
- **Page**: Content pages (Bilgi, Prosedür, Duyuru, Uyarı)
- **File**: File attachments for pages
- **Comment**: User comments on pages
- **Notification**: In-app notifications
- **ActivityLog**: Audit trail for user actions

### User Roles

- `SYSTEM_ADMIN`: Full system access and technical settings
- `ADMIN`: User management and administrative functions
- `EDITOR`: Content creation and editing
- `MEMBER`: Content viewing and commenting

### Content Types

- `INFO`: Informational content (Bilgi)
- `PROCEDURE`: Process and procedure documentation (Prosedür)
- `ANNOUNCEMENT`: Company announcements (Duyuru)
- `WARNING`: Important warnings and alerts (Uyarı)

## Development Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and apply migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Production Deployment

For production deployment on Coolify:

1. Set up PostgreSQL database on your server
2. Update `DATABASE_URL` environment variable
3. Run migrations: `npx prisma migrate deploy`
4. Generate client: `npx prisma generate`

## Troubleshooting

### Connection Issues

1. **Check PostgreSQL service:**
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Ubuntu
   sudo systemctl status postgresql
   ```

2. **Test connection:**
   ```bash
   psql -h localhost -U verida_user -d verida_kurumsal_db
   ```

3. **Check database URL format:**
   ```
   postgresql://[user]:[password]@[host]:[port]/[database]
   ```

### Migration Issues

1. **Reset migrations (development only):**
   ```bash
   npx prisma migrate reset
   ```

2. **Force push schema (development only):**
   ```bash
   npx prisma db push --force-reset
   ```

### Permission Issues

Make sure the database user has proper permissions:

```sql
GRANT ALL PRIVILEGES ON DATABASE verida_kurumsal_db TO verida_user;
GRANT ALL ON SCHEMA public TO verida_user;
```