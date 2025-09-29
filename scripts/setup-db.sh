#!/bin/bash

# Database setup script for Verida Kurumsal Bilgi Uygulaması
# This script sets up the PostgreSQL database for development

echo "Setting up Verida database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install PostgreSQL first."
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready &> /dev/null; then
    echo "PostgreSQL service is not running. Please start PostgreSQL service."
    echo "On macOS: brew services start postgresql"
    echo "On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

# Database configuration
DB_NAME="verida"
DB_USER="veridausr"
DB_PASSWORD="hNdR5GhkmswT?S345*"
DB_HOST="localhost"
DB_PORT="5432"

# Create database user
echo "Creating database user..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User may already exist"

# Create database
echo "Creating database..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Database may already exist"

# Grant privileges
echo "Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Update .env.local file
ENV_FILE=".env.local"
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo "Updating $ENV_FILE..."
if [ -f "$ENV_FILE" ]; then
    # Update existing DATABASE_URL
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" "$ENV_FILE"
else
    # Create new .env.local file
    cp .env.example "$ENV_FILE"
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" "$ENV_FILE"
fi

echo "Database setup completed!"
echo "DATABASE_URL: $DATABASE_URL"
echo ""
echo "Next steps:"
echo "1. Run 'npm run db:migrate' to apply database migrations"
echo "2. Run 'npm run dev' to start the development server"