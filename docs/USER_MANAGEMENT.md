# User Management System

This document describes the user management functionality implemented for administrators in the Verida Corporate Information Application.

## Overview

The user management system allows administrators to:
- View and search all users in the system
- Create new users with appropriate roles
- Modify user roles and permissions
- Deactivate/delete users when necessary
- Monitor user activity and statistics

## Access Control

### Who Can Access User Management

- **System Administrators**: Full access to all user management features
- **Administrators**: Can manage Editors and Members, but not other Admins or System Administrators
- **Editors**: No access to user management
- **Members**: No access to user management

### Permission Matrix

| Action | System Admin | Admin | Editor | Member |
|--------|--------------|-------|--------|--------|
| View user list | ✅ | ✅ | ❌ | ❌ |
| Create users | ✅ | ✅ | ❌ | ❌ |
| Edit user roles | ✅ | ✅* | ❌ | ❌ |
| Delete users | ✅ | ✅* | ❌ | ❌ |
| Assign System Admin role | ✅ | ❌ | ❌ | ❌ |
| Assign Admin role | ✅ | ❌ | ❌ | ❌ |

*Admins can only modify Editors and Members, not other Admins or System Administrators.

## Features

### 1. User Dashboard (`/admin/users`)

The main user management interface provides:

- **User List**: Paginated table showing all users with their details
- **Search**: Find users by name or email
- **Role Filter**: Filter users by their assigned role
- **User Statistics**: Shows page count and comment count for each user
- **Status Indicators**: Shows if user email is verified

### 2. User Creation

Administrators can create new users with:

- **Email Validation**: Must be @dgmgumruk.com domain
- **Name Requirement**: Full name is required
- **Role Assignment**: Choose appropriate role based on permissions
- **Auto-verification**: Admin-created users are automatically email-verified

### 3. Role Management

- **Role Assignment**: Change user roles with appropriate permission checks
- **Role Descriptions**: Clear descriptions of what each role can do
- **Permission Validation**: System prevents unauthorized role assignments
- **Activity Logging**: All role changes are logged for audit purposes

### 4. User Deactivation/Deletion

- **Safe Deletion**: Prevents self-deletion and unauthorized deletions
- **Confirmation**: Requires confirmation before permanent deletion
- **Cascade Handling**: Related data is handled appropriately
- **Activity Logging**: Deletion actions are logged

## User Interface Components

### Main Components

1. **UserManagementDashboard**: Main container component
2. **UserList**: Displays paginated user table
3. **UserInviteForm**: Modal for creating new users
4. **UserRoleManager**: Modal for changing user roles

### Key Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Interface updates after user actions
- **Error Handling**: Clear error messages and validation
- **Loading States**: Proper loading indicators during operations

## API Endpoints

### User Management APIs

- `GET /api/users` - List users with pagination and filtering
- `POST /api/users` - Create new user (Admin only)
- `GET /api/users/[id]` - Get specific user details
- `PUT /api/users/[id]` - Update user information
- `DELETE /api/users/[id]` - Delete user (Admin only)
- `PUT /api/users/[id]/role` - Update user role (Admin only)

### Request/Response Examples

#### Create User
```json
POST /api/users
{
  "email": "newuser@dgmgumruk.com",
  "name": "New User",
  "role": "MEMBER"
}
```

#### Update Role
```json
PUT /api/users/user-id/role
{
  "role": "EDITOR"
}
```

## Security Considerations

### Authentication & Authorization

- All endpoints require authentication
- Role-based access control enforced at API level
- Middleware validates user permissions before operations
- Self-modification prevention (users can't modify their own roles/delete themselves)

### Input Validation

- Email domain restriction (@dgmgumruk.com only)
- Zod schema validation for all inputs
- SQL injection prevention through Prisma ORM
- XSS protection through input sanitization

### Activity Logging

All user management actions are logged including:
- User creation by administrators
- Role changes with before/after values
- User deletions
- Failed permission attempts

## Navigation

User management is accessible through:

- **Desktop**: Header navigation "Kullanıcı Yönetimi" link (👥 icon)
- **Mobile**: Mobile menu "Kullanıcı Yönetimi" option
- **Direct URL**: `/admin/users`

## Error Handling

The system provides clear error messages for:

- **Permission Denied**: When user lacks required permissions
- **Validation Errors**: Invalid email domains, missing required fields
- **Conflict Errors**: Attempting to create users with existing emails
- **Network Errors**: API communication failures

## Testing

User management functionality is tested through:

- **Unit Tests**: Role validation, permission checks, email validation
- **Integration Tests**: API endpoint testing
- **Manual Testing**: UI component functionality

Run tests with:
```bash
npx tsx scripts/tests/test-user-management.ts
```

## Future Enhancements

Potential improvements for the user management system:

1. **Bulk Operations**: Select and modify multiple users at once
2. **User Import**: CSV import for bulk user creation
3. **Advanced Filtering**: Filter by creation date, last login, etc.
4. **User Profiles**: Extended user information and preferences
5. **Audit Trail**: Detailed history of all user changes
6. **Email Notifications**: Notify users when their roles change

## Troubleshooting

### Common Issues

1. **Can't see user management menu**: Check if user has Admin or System Admin role
2. **Permission denied errors**: Verify user role and target user role compatibility
3. **Email validation fails**: Ensure email ends with @dgmgumruk.com
4. **Can't delete user**: Check if trying to delete self or higher-privileged user

### Support

For technical support or questions about user management:
1. Check the activity logs for detailed error information
2. Verify user permissions and role assignments
3. Review the API response messages for specific error details
4. Contact system administrator if issues persist