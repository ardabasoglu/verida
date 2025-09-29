# Development Setup Guide

## Prerequisites

### Required Software
- **Node.js**: v18.17.0 veya üzeri
- **npm**: v9.0.0 veya üzeri
- **PostgreSQL**: v14 veya üzeri
- **Git**: Version control

### Recommended Tools
- **VS Code**: IDE with extensions
- **Prisma Studio**: Database GUI
- **Postman/Insomnia**: API testing
- **Docker**: Optional containerization

## Initial Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd verida
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/verida_kurumsal_db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Email (Optional for development)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@dgmgumruk.com"
```

### 4. Database Setup

#### Option A: Automated Setup
```bash
# Run the setup script
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

#### Option B: Manual Setup
```bash
# Create database
createdb verida_kurumsal_db

# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Development Workflow

### Code Quality Tools

#### ESLint Configuration
```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

#### Prettier Formatting
```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

#### TypeScript Checking
```bash
# Type check
npm run type-check
```

### Database Development

#### Prisma Commands
```bash
# Generate client after schema changes
npm run db:generate

# Create and apply migration
npm run db:migrate

# Push schema changes (development)
npm run db:push

# Open Prisma Studio
npm run db:studio

# Reset database (careful!)
npm run db:reset
```

#### Schema Changes Workflow
1. Edit `prisma/schema.prisma`
2. Run `npm run db:generate`
3. Create migration: `npm run db:migrate`
4. Update TypeScript types if needed

### Testing

#### AI Test Scripts
```bash
# Test role utilities and permissions
npx tsx scripts/test-role-management.ts

# Test API validation schemas
npx tsx scripts/test-api-validation.ts

# Run all test scripts
find scripts -name "test-*.ts" -exec npx tsx {} \;
```

#### Manual Testing Workflow
1. Start development server: `npm run dev`
2. Visit health endpoint: `http://localhost:3000/api/health`
3. Test authentication flow with @dgmgumruk.com email
4. Test role-based access with different user roles
5. Verify API endpoints with Postman/curl

## VS Code Setup

### Recommended Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Settings Configuration
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## Project Structure

```
verida/
├── .env.example              # Environment template
├── .env.local               # Local environment (git ignored)
├── docs/                    # Documentation
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration files
│   └── seed.ts            # Database seeding
├── scripts/                # Utility scripts
│   ├── setup-db.sh        # Database setup
│   ├── test-role-management.ts
│   └── test-api-validation.ts
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── auth/         # Authentication components
│   │   └── layout/       # Layout components
│   ├── lib/              # Utility libraries
│   │   ├── auth.ts       # NextAuth configuration
│   │   ├── auth-utils.ts # Authentication utilities
│   │   ├── role-utils.ts # Role management utilities
│   │   ├── prisma.ts     # Prisma client
│   │   ├── validations/  # Zod schemas
│   │   └── api-middleware.ts
│   └── types/            # TypeScript definitions
└── public/               # Static assets
```

## Common Development Tasks

### Adding New API Endpoint
1. Create route file in `src/app/api/`
2. Add validation schema in `src/lib/validations/`
3. Add TypeScript types in `src/types/`
4. Test with Postman/curl
5. Add documentation

### Adding New Database Model
1. Update `prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Update TypeScript types
4. Add validation schemas
5. Create utility functions

### Adding New Component
1. Create component in appropriate folder
2. Add TypeScript interfaces
3. Style with Tailwind CSS
4. Test in Storybook (if configured)
5. Document usage

## Debugging

### Database Issues
```bash
# Check database connection
npm run db:studio

# View logs
tail -f logs/app.log

# Reset database
npm run db:reset
```

### Authentication Issues
1. Check environment variables
2. Verify NextAuth configuration
3. Clear browser cookies
4. Check network tab in DevTools

### Build Issues
```bash
# Clean build
rm -rf .next
npm run build

# Type check
npm run type-check

# Lint check
npm run lint
```

## Performance Optimization

### Development Mode
- Use `npm run dev` for hot reloading
- Enable React DevTools
- Use Prisma Studio for database queries

### Build Optimization
```bash
# Analyze bundle
npm run build
npm run start

# Check bundle size
npx @next/bundle-analyzer
```

## Git Workflow

### Branch Strategy
- `main`: Production ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `hotfix/*`: Critical fixes

### Commit Convention
```bash
# Format: type(scope): description
git commit -m "feat(auth): add role-based access control"
git commit -m "fix(api): handle validation errors properly"
git commit -m "docs(readme): update setup instructions"
```

### Pre-commit Hooks
```bash
# Install husky (if configured)
npm run prepare

# Hooks will run:
# - ESLint
# - Prettier
# - Type check
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

#### Database Connection Error
1. Check PostgreSQL is running
2. Verify DATABASE_URL
3. Check database exists
4. Verify credentials

#### Module Not Found
```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Restart TypeScript server in VS Code
Cmd+Shift+P -> "TypeScript: Restart TS Server"

# Or run type check
npm run type-check
```

### Getting Help
1. Check documentation in `docs/`
2. Review error logs
3. Search GitHub issues
4. Ask team members
5. Create detailed bug report

## Production Deployment

### Build Process
```bash
# Production build
npm run build

# Start production server
npm run start
```

### Environment Variables
- Set all required environment variables
- Use strong secrets
- Enable HTTPS
- Configure proper DATABASE_URL

### Health Checks
- Monitor `/api/health` endpoint
- Set up database monitoring
- Configure error tracking
- Set up log aggregation