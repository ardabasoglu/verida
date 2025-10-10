#!/bin/bash

# Coolify Startup Script
# Database setup and application startup

set -e

echo "🚀 Starting Verida application..."

# Check required environment variables
REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_URL" "NEXTAUTH_SECRET" "EMAIL_FROM")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ ERROR: $var environment variable is not set"
        exit 1
    fi
done

echo "✅ All required environment variables are set"

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
    if npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
        echo "✅ Database connection verified"
        break
    fi
    echo "Waiting for database... ($i/30)"
    sleep 2
done

# Setup database (generate client, push schema, add indexes)
echo "🔧 Setting up database..."
npm run db:setup:prod

# Optional: Seed database if needed
if [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed || echo "⚠️ Database seeding failed or skipped"
fi

# Start the Next.js application
echo "🌟 Starting Next.js server..."
exec npm run start:prod