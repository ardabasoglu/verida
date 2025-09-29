# Role Management System Documentation

## Overview

The Verida application implements a comprehensive role-based access control (RBAC) system with four distinct user roles, each with specific permissions and capabilities.

## User Roles

### 1. Üye (MEMBER)
- **Description**: Sadece içerik görüntüleme ve yorum ekleme yetkisi
- **Permissions**:
  - İçerikleri görüntüleme
  - Yorum ekleme
  - Arama yapma
- **Badge Color**: `bg-gray-100 text-gray-800`

### 2. Editör (EDITOR)
- **Description**: İçerik oluşturma ve düzenleme yetkisi
- **Permissions**:
  - Tüm üye yetkileri
  - İçerik oluşturma
  - İçerik düzenleme
  - Dosya yükleme
  - Etiket yönetimi
- **Badge Color**: `bg-blue-100 text-blue-800`

### 3. Yönetici (ADMIN)
- **Description**: Kullanıcı yönetimi ve tüm içerik yetkileri
- **Permissions**:
  - Tüm editör yetkileri
  - Kullanıcı ekleme/silme
  - Rol atama (Editör/Üye)
  - Aktivite logları görüntüleme
  - Yorum yönetimi
- **Badge Color**: `bg-green-100 text-green-800`

### 4. Sistem Yöneticisi (SYSTEM_ADMIN)
- **Description**: Tam sistem erişimi ve teknik yönetim yetkisi
- **Permissions**:
  - Tüm yönetici yetkileri
  - Sistem Yöneticisi rolü atama
  - Sistem ayarları
  - Teknik konfigürasyon
  - Veritabanı yönetimi
- **Badge Color**: `bg-red-100 text-red-800`

## API Endpoints

### User Management

#### GET /api/users
- **Description**: List all users with pagination and filtering
- **Access**: Admin only (ADMIN, SYSTEM_ADMIN)
- **Query Parameters**:
  - `search` (optional): Search by name or email
  - `role` (optional): Filter by user role
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)

#### POST /api/users
- **Description**: Create a new user
- **Access**: Admin only (ADMIN, SYSTEM_ADMIN)
- **Body**:
  ```json
  {
    "email": "user@dgmgumruk.com",
    "name": "User Name",
    "role": "MEMBER"
  }
  ```

#### GET /api/users/[id]
- **Description**: Get user details by ID
- **Access**: Admin only (ADMIN, SYSTEM_ADMIN)

#### PUT /api/users/[id]
- **Description**: Update user information
- **Access**: Admin only (ADMIN, SYSTEM_ADMIN)
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "role": "EDITOR"
  }
  ```

#### DELETE /api/users/[id]
- **Description**: Delete a user
- **Access**: Admin only (ADMIN, SYSTEM_ADMIN)
- **Restrictions**: Cannot delete own account

#### PUT /api/users/[id]/role
- **Description**: Update user role specifically
- **Access**: Admin only (ADMIN, SYSTEM_ADMIN)
- **Body**:
  ```json
  {
    "role": "EDITOR"
  }
  ```
- **Restrictions**: 
  - Cannot modify own role
  - Only SYSTEM_ADMIN can assign SYSTEM_ADMIN role

#### GET /api/users/roles
- **Description**: Get available user roles with descriptions
- **Access**: Admin only (ADMIN, SYSTEM_ADMIN)

## Role Assignment Rules

### Who Can Assign What

1. **SYSTEM_ADMIN**:
   - Can assign any role (MEMBER, EDITOR, ADMIN, SYSTEM_ADMIN)
   - Cannot modify their own role

2. **ADMIN**:
   - Can assign MEMBER, EDITOR, ADMIN roles
   - Cannot assign SYSTEM_ADMIN role
   - Cannot modify their own role

3. **EDITOR & MEMBER**:
   - Cannot assign any roles

### Role Change Validation

The system validates role changes based on:
- Current user's role and permissions
- Target user's current role
- Requested new role
- Self-modification restrictions

## Middleware Protection

### Route Protection

The application uses middleware to protect routes based on user roles:

```typescript
// Admin routes (requires ADMIN or SYSTEM_ADMIN)
/admin/*

// Editor routes (requires EDITOR, ADMIN, or SYSTEM_ADMIN)
/editor/*
```

### API Protection

All user management API endpoints are protected with:
- Authentication check (valid session)
- Domain restriction (@dgmgumruk.com)
- Role-based access control

## Utility Functions

### Auth Utils (`/src/lib/auth-utils.ts`)

- `hasRole(userRole, requiredRoles)`: Check if user has any of the required roles
- `isAdmin(userRole)`: Check if user is admin (ADMIN or SYSTEM_ADMIN)
- `canEditContent(userRole)`: Check if user can edit content
- `canManageUsers(userRole)`: Check if user can manage other users
- `canAssignRole(currentRole, targetRole)`: Check if user can assign specific role
- `requireAdmin()`: Server-side function to require admin access

### Role Utils (`/src/lib/role-utils.ts`)

- `getRoleDefinition(role)`: Get role definition with label, description, etc.
- `getAllRoles()`: Get all available roles
- `getAssignableRoles(currentRole)`: Get roles that current user can assign
- `isRoleChangeAllowed(currentRole, targetRole, newRole)`: Validate role change
- `formatRole(role)`: Format role for display

## Validation Schemas

### User Creation
```typescript
{
  email: string (must end with @dgmgumruk.com),
  name: string (2-100 characters),
  role: UserRole (default: MEMBER)
}
```

### User Update
```typescript
{
  name?: string (2-100 characters),
  role?: UserRole
}
```

### Role Update
```typescript
{
  role: UserRole (required)
}
```

## Activity Logging

All user management actions are logged with:
- User who performed the action
- Action type (USER_CREATED_BY_ADMIN, USER_UPDATED_BY_ADMIN, etc.)
- Target user information
- Previous and new values (for updates)
- Timestamp

## Security Features

1. **Domain Restriction**: Only @dgmgumruk.com email addresses allowed
2. **Self-Modification Prevention**: Users cannot modify their own roles or delete themselves
3. **Role Hierarchy**: Higher roles can manage lower roles, with specific restrictions
4. **Input Validation**: All inputs validated with Zod schemas
5. **Activity Logging**: All actions logged for audit trail
6. **Session-Based Auth**: JWT tokens with role information

## Testing

Run the role management tests:

```bash
# Test role utilities and permissions
npx tsx scripts/test-role-management.ts

# Test API validation schemas
npx tsx scripts/test-api-validation.ts
```

## Error Handling

The system provides comprehensive error handling:
- Validation errors with detailed messages
- Permission denied errors
- Not found errors
- Conflict errors (duplicate users)
- Server errors with logging

All error messages are in Turkish to match the application's language.