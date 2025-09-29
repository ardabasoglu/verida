# Security Guide

## Overview

Verida Kurumsal Bilgi Uygulaması güvenlik özellikleri ve en iyi uygulamalar rehberi.

## Authentication & Authorization

### Email Domain Restriction
- **Kısıtlama**: Sadece @dgmgumruk.com uzantılı email adresleri
- **Uygulama**: Hem kayıt hem giriş sırasında kontrol edilir
- **Validation**: Zod schema ile server-side doğrulama

```typescript
// Email validation
const email = z.string()
  .email('Geçerli bir e-posta adresi giriniz')
  .refine(
    (email) => email.endsWith('@dgmgumruk.com'),
    { message: 'E-posta adresi @dgmgumruk.com uzantılı olmalıdır' }
  )
```

### Session Management
- **Provider**: NextAuth.js JWT strategy
- **Storage**: HTTP-only cookies
- **Expiration**: Session timeout yapılandırılabilir
- **Security**: CSRF protection dahili

### Role-Based Access Control (RBAC)

#### Role Hierarchy
1. **SYSTEM_ADMIN** - En yüksek yetki
2. **ADMIN** - Kullanıcı yönetimi
3. **EDITOR** - İçerik yönetimi
4. **MEMBER** - Sadece okuma

#### Permission Matrix

| Action | MEMBER | EDITOR | ADMIN | SYSTEM_ADMIN |
|--------|--------|--------|-------|--------------|
| View Content | ✅ | ✅ | ✅ | ✅ |
| Add Comments | ✅ | ✅ | ✅ | ✅ |
| Create Content | ❌ | ✅ | ✅ | ✅ |
| Edit Content | ❌ | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ | ✅ |
| Assign Roles | ❌ | ❌ | ✅* | ✅ |
| System Config | ❌ | ❌ | ❌ | ✅ |

*ADMIN sadece MEMBER, EDITOR, ADMIN rolleri atayabilir

## Input Validation & Sanitization

### Server-Side Validation
- **Library**: Zod schemas
- **Coverage**: Tüm API endpoint'leri
- **Types**: Email, string length, enum values

### Client-Side Validation
- **Library**: React Hook Form + Zod resolver
- **Real-time**: Form field validation
- **UX**: Immediate feedback

### SQL Injection Prevention
- **ORM**: Prisma ile parameterized queries
- **Raw Queries**: Kullanılmıyor
- **Input Escaping**: Otomatik

## Data Protection

### Personal Data Handling
- **Minimal Collection**: Sadece gerekli veriler
- **Email Encryption**: Veritabanında plain text (internal system)
- **Password**: NextAuth.js tarafından yönetilir

### File Upload Security
- **File Types**: Whitelist approach
- **Size Limits**: 10MB maksimum
- **Storage**: Local filesystem (Coolify volume)
- **Validation**: MIME type kontrolü

```typescript
const allowedFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
```

## API Security

### Authentication Middleware
```typescript
// Route protection
export default withAuth(
  function middleware(req) {
    // Role-based access control
    if (pathname.startsWith('/admin/')) {
      if (token.role !== 'SYSTEM_ADMIN' && token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
  }
)
```

### CORS Configuration
- **Same-Origin**: Default policy
- **Credentials**: Include for authentication
- **Headers**: Content-Type, Authorization

### Rate Limiting
- **Status**: Henüz uygulanmadı
- **Recommendation**: Production için gerekli
- **Implementation**: next-rate-limit önerilir

## Database Security

### Connection Security
- **SSL**: Production için zorunlu
- **Connection Pooling**: Prisma ile yönetilir
- **Credentials**: Environment variables

### Data Integrity
- **Constraints**: Foreign key relationships
- **Validation**: Database level + application level
- **Transactions**: Critical operations için

### Backup & Recovery
- **Automated Backups**: PostgreSQL düzeyinde
- **Point-in-Time Recovery**: Mümkün
- **Testing**: Backup restore testleri önerilir

## Audit & Logging

### Activity Logging
```typescript
// Tüm kritik işlemler loglanır
await prisma.activityLog.create({
  data: {
    userId: currentUser.id,
    action: 'USER_CREATED_BY_ADMIN',
    resourceType: 'User',
    resourceId: newUser.id,
    details: {
      createdUserEmail: newUser.email,
      createdUserRole: newUser.role,
      timestamp: new Date().toISOString(),
    },
  },
})
```

### Log Categories
- **Authentication**: Login/logout events
- **Authorization**: Permission denials
- **Data Changes**: CRUD operations
- **System Events**: Errors, performance

### Log Retention
- **Duration**: Konfigüre edilebilir
- **Storage**: Database (ActivityLog table)
- **Analysis**: Prisma Studio ile görüntülenebilir

## Environment Security

### Environment Variables
```bash
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://..."
NEXTAUTH_SECRET="strong-random-secret"

# Email (if configured)
EMAIL_SERVER_HOST="smtp...."
EMAIL_SERVER_USER="..."
EMAIL_SERVER_PASSWORD="..."
EMAIL_FROM="noreply@dgmgumruk.com"
```

### Secret Management
- **Storage**: .env files (development)
- **Production**: Environment variables
- **Rotation**: Düzenli secret rotation önerilir

## Security Headers

### Recommended Headers
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## Vulnerability Prevention

### XSS Prevention
- **React**: Built-in XSS protection
- **Sanitization**: DOMPurify for rich content
- **CSP**: Content Security Policy önerilir

### CSRF Prevention
- **NextAuth.js**: Built-in CSRF protection
- **SameSite Cookies**: Strict mode
- **Double Submit**: Token validation

### Injection Attacks
- **SQL Injection**: Prisma ORM protection
- **NoSQL Injection**: N/A (PostgreSQL kullanımı)
- **Command Injection**: Input validation

## Monitoring & Alerting

### Security Monitoring
- **Failed Logins**: Rate limiting gerekli
- **Permission Violations**: Activity log
- **Unusual Activity**: Manual monitoring

### Error Handling
- **Information Disclosure**: Generic error messages
- **Stack Traces**: Production'da gizli
- **Logging**: Detailed server-side logs

## Compliance & Best Practices

### Data Privacy
- **KVKK Compliance**: Kişisel veri koruma
- **Data Minimization**: Sadece gerekli veriler
- **Right to Deletion**: User deletion API

### Security Testing
- **Unit Tests**: Security functions
- **Integration Tests**: Auth flows
- **Penetration Testing**: Önerilir

### Regular Updates
- **Dependencies**: npm audit
- **Security Patches**: Düzenli güncellemeler
- **Vulnerability Scanning**: Automated tools

## Incident Response

### Security Incident Plan
1. **Detection**: Monitoring & alerts
2. **Assessment**: Impact analysis
3. **Containment**: Immediate actions
4. **Recovery**: System restoration
5. **Lessons Learned**: Process improvement

### Contact Information
- **Security Team**: IT Department
- **Escalation**: Management
- **External**: Security consultants (if needed)

## Security Checklist

### Development
- [ ] Input validation implemented
- [ ] Authentication working
- [ ] Authorization rules enforced
- [ ] Error handling secure
- [ ] Logging configured

### Deployment
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Monitoring enabled

### Maintenance
- [ ] Regular security updates
- [ ] Log review process
- [ ] Backup testing
- [ ] Access review
- [ ] Security training