#!/bin/bash

# Coolify Startup Script
# This script runs before starting the Next.js application

set -e

echo "🚀 Starting Verida application..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Generate Prisma client (in case it's not generated during build)
echo "🔧 Ensuring Prisma client is generated..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Database setup completed"

# Start the Next.js application
echo "🌟 Starting Next.js server..."
exec npm start