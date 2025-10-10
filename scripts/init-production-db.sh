#!/bin/bash

# Production Database Initialization Script
# This script ensures the database is properly set up for production deployment

set -e

echo "🚀 Initializing production database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📊 Database URL: ${DATABASE_URL}"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check database connection
echo "🔍 Testing database connection..."
npx prisma db execute --stdin <<< "SELECT 1;" || {
    echo "❌ ERROR: Cannot connect to database"
    echo "Please check your DATABASE_URL and ensure the database server is running"
    exit 1
}

echo "✅ Database connection successful"

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Verify tables exist
echo "🔍 Verifying database schema..."
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pages';" || {
    echo "❌ ERROR: Pages table not found after migration"
    exit 1
}

echo "✅ Database schema verified"

# Optional: Seed database if no users exist
echo "🌱 Checking if database needs seeding..."
USER_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;" | tail -n 1 | tr -d ' ')

if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 Database is empty, running seed script..."
    npm run db:seed || {
        echo "⚠️  Warning: Seeding failed, but continuing deployment"
    }
else
    echo "✅ Database already contains data, skipping seed"
fi

echo "🎉 Database initialization completed successfully!"