#!/bin/bash

# Coolify Build Script
# This script runs during the build phase on Coolify's build server
# It should NOT require database access

set -e

echo "🚀 Starting Coolify build process..."

# Check Node.js version
echo "📋 Node.js version: $(node --version)"
echo "📋 NPM version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client (without database connection)
echo "🔧 Generating Prisma client..."
npm run db:generate:safe

# Build Next.js application
echo "🏗️ Building Next.js application..."
npm run build:coolify

echo "✅ Build completed successfully!"
echo "📊 Build artifacts ready for deployment"

# Display build info
echo ""
echo "📈 Build Summary:"
echo "- Dependencies: Installed"
echo "- Prisma Client: Generated"
echo "- Next.js Build: Complete"
echo "- Database: Not required during build"
echo ""
echo "🎯 Ready for deployment to Coolify!"