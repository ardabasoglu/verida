# API Documentation

## Overview

Verida Kurumsal Bilgi Uygulaması REST API dokümantasyonu. Tüm API endpoint'leri, parametreleri ve yanıt formatları bu dokümanda açıklanmıştır.

## Base URL

```
http://localhost:3000/api  # Development
https://your-domain.com/api  # Production
```

## Authentication

API, NextAuth.js tabanlı session authentication kullanır. Tüm korumalı endpoint'ler için geçerli bir session gereklidir.

### Authentication Headers

```http
Cookie: next-auth.session-token=<session-token>
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "İşlem başarılı"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Hata mesajı",
  "details": [...] // Validation errors için
}
```

### Pagination Response
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

## Endpoints

### Health Check

#### GET /api/health
Sistem durumunu kontrol eder.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### User Management

#### GET /api/users
Kullanıcıları listeler (Admin yetkisi gerekli).

**Query Parameters:**
- `search` (string, optional): İsim veya email ile arama
- `role` (UserRole, optional): Role göre filtreleme
- `page` (number, optional): Sayfa numarası (default: 1)
- `limit` (number, optional): Sayfa başına kayıt (default: 10, max: 100)

**Response:**
```json
{
  "users": [
    {
      "id": "clx123...",
      "name": "John Doe",
      "email": "john@dgmgumruk.com",
      "role": "EDITOR",
      "emailVerified": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "pages": 5,
        "comments": 12
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### POST /api/users
Yeni kullanıcı oluşturur (Admin yetkisi gerekli).

**Request Body:**
```json
{
  "email": "user@dgmgumruk.com",
  "name": "User Name",
  "role": "MEMBER"
}
```

**Response:**
```json
{
  "id": "clx123...",
  "name": "User Name",
  "email": "user@dgmgumruk.com",
  "role": "MEMBER",
  "emailVerified": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/users/[id]
Kullanıcı detaylarını getirir (Admin yetkisi gerekli).

**Response:**
```json
{
  "id": "clx123...",
  "name": "User Name",
  "email": "user@dgmgumruk.com",
  "role": "MEMBER",
  "emailVerified": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "_count": {
    "pages": 0,
    "comments": 0,
    "files": 0
  }
}
```

#### PUT /api/users/[id]
Kullanıcı bilgilerini günceller (Admin yetkisi gerekli).

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "EDITOR"
}
```

#### DELETE /api/users/[id]
Kullanıcıyı siler (Admin yetkisi gerekli).

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

#### PUT /api/users/[id]/role
Kullanıcı rolünü günceller (Admin yetkisi gerekli).

**Request Body:**
```json
{
  "role": "EDITOR"
}
```

**Response:**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "clx123...",
    "name": "User Name",
    "email": "user@dgmgumruk.com",
    "role": "EDITOR",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/users/roles
Mevcut rolleri listeler (Admin yetkisi gerekli).

**Response:**
```json
{
  "roles": [
    {
      "value": "MEMBER",
      "label": "Üye",
      "description": "Sadece içerik görüntüleme ve yorum ekleme yetkisi"
    },
    {
      "value": "EDITOR",
      "label": "Editör",
      "description": "İçerik oluşturma ve düzenleme yetkisi"
    },
    {
      "value": "ADMIN",
      "label": "Yönetici",
      "description": "Kullanıcı yönetimi ve tüm içerik yetkileri"
    },
    {
      "value": "SYSTEM_ADMIN",
      "label": "Sistem Yöneticisi",
      "description": "Tam sistem erişimi ve teknik yönetim yetkisi"
    }
  ]
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Geçersiz istek parametreleri |
| 401 | Unauthorized - Kimlik doğrulama gerekli |
| 403 | Forbidden - Yetkisiz erişim |
| 404 | Not Found - Kaynak bulunamadı |
| 409 | Conflict - Çakışma (örn: email zaten mevcut) |
| 500 | Internal Server Error - Sunucu hatası |

## Rate Limiting

API endpoint'leri için rate limiting uygulanmamıştır, ancak üretim ortamında uygulanması önerilir.

## Validation Rules

### Email Validation
- Sadece @dgmgumruk.com uzantılı email adresleri kabul edilir
- Geçerli email formatı olmalıdır

### Name Validation
- Minimum 2 karakter
- Maksimum 100 karakter
- Boş olamaz

### Role Validation
- Geçerli UserRole enum değeri olmalıdır
- MEMBER, EDITOR, ADMIN, SYSTEM_ADMIN

## Examples

### cURL Examples

#### List Users
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Cookie: next-auth.session-token=<session-token>"
```

#### Create User
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<session-token>" \
  -d '{
    "email": "newuser@dgmgumruk.com",
    "name": "New User",
    "role": "MEMBER"
  }'
```

#### Update User Role
```bash
curl -X PUT "http://localhost:3000/api/users/clx123.../role" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<session-token>" \
  -d '{
    "role": "EDITOR"
  }'
```

## JavaScript/TypeScript Examples

### Fetch API
```typescript
// List users
const response = await fetch('/api/users?page=1&limit=10', {
  credentials: 'include'
});
const data = await response.json();

// Create user
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'newuser@dgmgumruk.com',
    name: 'New User',
    role: 'MEMBER'
  })
});
```

### Axios
```typescript
import axios from 'axios';

// Configure axios to include credentials
axios.defaults.withCredentials = true;

// List users
const { data } = await axios.get('/api/users', {
  params: { page: 1, limit: 10 }
});

// Create user
const { data } = await axios.post('/api/users', {
  email: 'newuser@dgmgumruk.com',
  name: 'New User',
  role: 'MEMBER'
});
```