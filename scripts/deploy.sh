#!/bin/bash

# Verida Kurumsal Bilgi Uygulaması Deployment Script
# This script handles the complete deployment process for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="verida-kurumsal-bilgi"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
BACKUP_DIR="./backups"
LOG_FILE="./deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18 or higher."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18 or higher is required. Current version: $(node -v)"
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
    fi
    
    # Check if Docker is available (for Coolify)
    if ! command -v docker &> /dev/null; then
        warning "Docker is not installed. Required for Coolify deployment."
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.${DEPLOY_ENV}" ]; then
        error "Environment file .env.${DEPLOY_ENV} not found."
    fi
    
    success "Prerequisites check completed"
}

# Backup existing data
backup_data() {
    log "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if [ -n "$DATABASE_URL" ]; then
        # Extract database connection details
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
        
        if command -v pg_dump &> /dev/null; then
            log "Creating database backup: $BACKUP_FILE"
            PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"
            success "Database backup created: $BACKUP_FILE"
        else
            warning "pg_dump not found. Skipping database backup."
        fi
    else
        warning "DATABASE_URL not set. Skipping database backup."
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Clean install
    rm -rf node_modules package-lock.json
    npm ci --only=production
    
    success "Dependencies installed"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Use the production database initialization script
    if [ -f "scripts/init-production-db.sh" ]; then
        bash scripts/init-production-db.sh
    else
        # Fallback to manual migration
        npx prisma generate
        npx prisma migrate deploy
    fi
    
    success "Database migrations completed"
}

# Build application
build_application() {
    log "Building application..."
    
    # Set environment
    export NODE_ENV="$DEPLOY_ENV"
    
    # Build Next.js application
    npm run build
    
    success "Application built successfully"
}

# Run integration tests
run_tests() {
    log "Running integration tests..."
    
    # Run integration test script
    if [ -f "scripts/integration-test.ts" ]; then
        npx tsx scripts/integration-test.ts
        success "Integration tests passed"
    else
        warning "Integration test script not found. Skipping tests."
    fi
}

# Deploy to Coolify
deploy_coolify() {
    log "Deploying to Coolify..."
    
    # For Coolify, we just need to ensure the build is ready
    # Coolify handles the actual deployment process
    log "Build is ready for Coolify deployment"
    log "Push your changes to trigger Coolify deployment"
    
    success "Ready for Coolify deployment"
}

# Start application (for manual deployment)
start_application() {
    log "Starting application..."
    
    # Check if PM2 is available
    if command -v pm2 &> /dev/null; then
        pm2 start npm --name "$APP_NAME" -- start
        pm2 save
        success "Application started with PM2"
    else
        log "PM2 not found. Starting with npm..."
        npm start &
        success "Application started"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check health endpoint
    HEALTH_URL="${NEXTAUTH_URL:-http://localhost:3000}/api/health"
    
    for i in {1..30}; do
        if curl -f "$HEALTH_URL" &> /dev/null; then
            success "Health check passed"
            return 0
        fi
        log "Waiting for application to start... ($i/30)"
        sleep 2
    done
    
    error "Health check failed. Application may not be running properly."
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 7 days of backups
    find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete 2>/dev/null || true
    
    success "Backup cleanup completed"
}

# Main deployment function
main() {
    log "Starting deployment of $APP_NAME to $DEPLOY_ENV environment"
    
    # Load environment variables
    if [ -f ".env.${DEPLOY_ENV}" ]; then
        export $(cat ".env.${DEPLOY_ENV}" | grep -v '^#' | xargs)
    fi
    
    # Run deployment steps
    check_prerequisites
    backup_data
    install_dependencies
    run_migrations
    build_application
    run_tests
    
    # Choose deployment method
    case "$DEPLOY_METHOD" in
        "coolify")
            deploy_coolify
            ;;
        "manual")
            start_application
            ;;
        *)
            log "No deployment method specified. Starting manually..."
            start_application
            ;;
    esac
    
    health_check
    cleanup_backups
    
    success "Deployment completed successfully!"
    log "Application is running at: ${NEXTAUTH_URL:-http://localhost:3000}"
}

# Handle script arguments
case "$1" in
    "test")
        log "Running tests only..."
        check_prerequisites
        run_tests
        ;;
    "build")
        log "Building application only..."
        check_prerequisites
        install_dependencies
        build_application
        ;;
    "migrate")
        log "Running migrations only..."
        check_prerequisites
        run_migrations
        ;;
    *)
        main
        ;;
esac