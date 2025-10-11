#!/bin/bash

# Coolify Build Script
# This runs during the build phase when database is not available

set -e

echo "🔨 Building Verida application for Coolify..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client without database connection
echo "🔧 Generating Prisma client..."
npx prisma generate || {
    echo "⚠️ Prisma generate failed - will retry at runtime"
}

# Build Next.js application
echo "🏗️ Building Next.js application..."
export NEXT_PHASE=phase-production-build
npm run build:coolify

echo "✅ Build completed successfully!"