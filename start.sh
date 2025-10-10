#!/bin/bash

# Coolify Startup Script
# Database setup happens during build, this just starts the app

set -e

echo "🚀 Starting Verida application..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Quick database connection test
echo "🔍 Testing database connection..."
npx prisma db execute --stdin <<< "SELECT 1;" || {
    echo "❌ Database connection failed"
    exit 1
}

echo "✅ Database connection verified"

# Start the Next.js application
echo "🌟 Starting Next.js server..."
exec npm run start:prod