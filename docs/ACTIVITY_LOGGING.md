# Activity Logging System

## Overview

The activity logging system provides comprehensive tracking of all user actions within the Verida application. This system is designed to meet requirement 7, which mandates logging of all user activities for security and accountability purposes.

## Features

### 1. Comprehensive Activity Tracking
- **User Actions**: Login, logout, user creation, role changes
- **Page Actions**: Create, update, delete, view pages
- **File Actions**: Upload, download, delete files
- **Comment Actions**: Create, update, delete comments
- **Search Actions**: Track search queries and results
- **System Actions**: Administrative operations and maintenance

### 2. Enhanced Activity Logger
- **Structured Logging**: Uses predefined action types and resource types
- **Request Metadata**: Captures IP address, user agent, and browser information
- **Detailed Context**: Stores relevant details for each action
- **Error Handling**: Robust error handling with fallback logging

### 3. Administrative Interface
- **Activity Log Viewer**: Paginated view of all system activities
- **Advanced Filtering**: Filter by user, action type, resource type, date range
- **Activity Statistics**: Overview of system usage patterns
- **User Activity Summary**: Individual user activity reports

### 4. API Endpoints
- `GET /api/activity-logs` - List activity logs with filtering
- `GET /api/activity-logs/statistics` - Get activity statistics
- `GET /api/activity-logs/user/[userId]` - Get user activity summary
- `POST /api/activity-logs/test` - Test endpoint (development only)

## Usage

### Accessing Activity Logs (Administrators Only)

1. Navigate to `/admin/activity-logs` in the application
2. Use the tabs to switch between "Activity Logs" and "Statistics"
3. Apply filters to narrow down the results
4. View detailed information about each activity

### Activity Log Viewer Features

- **Real-time Updates**: Shows the latest activities
- **Pagination**: Load more results as needed
- **Detailed View**: Expandable details for each log entry
- **Export Capability**: (Future enhancement)

### Activity Statistics Features

- **Overview Metrics**: Total activities, action types, active users
- **Top Users**: Most active users in the system
- **Action Distribution**: Breakdown by action types
- **Resource Usage**: Activities by resource type
- **Date Range Filtering**: Custom time period analysis

## Technical Implementation

### ActivityLogger Class

```typescript
import { ActivityLogger, ActivityAction, ResourceType } from '@/lib/activity-logger';

// Log a user action
await ActivityLogger.log({
  userId: 'user-id',
  action: ActivityAction.PAGE_CREATED,
  resourceType: ResourceType.PAGE,
  resourceId: 'page-id',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  details: {
    title: 'Page Title',
    pageType: 'INFO'
  }
});
```

### Activity Action Types

- `USER_LOGIN`, `USER_LOGOUT`, `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `USER_ROLE_CHANGED`
- `PAGE_CREATED`, `PAGE_UPDATED`, `PAGE_DELETED`, `PAGE_VIEWED`
- `FILE_UPLOADED`, `FILE_DOWNLOADED`, `FILE_DELETED`
- `COMMENT_CREATED`, `COMMENT_UPDATED`, `COMMENT_DELETED`
- `SEARCH_PERFORMED`
- `NOTIFICATION_CREATED`, `NOTIFICATION_READ`
- `SYSTEM_BACKUP`, `SYSTEM_MAINTENANCE`

### Resource Types

- `USER`, `PAGE`, `FILE`, `COMMENT`, `NOTIFICATION`, `SYSTEM`

## Database Schema

The activity logs are stored in the `activity_logs` table with the following structure:

```sql
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  resourceType TEXT,
  resourceId TEXT,
  details JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## Security Considerations

### Access Control
- Only administrators (ADMIN, SYSTEM_ADMIN) can view activity logs
- Users can view their own activity summary
- All access to activity logs is logged

### Data Privacy
- IP addresses and user agents are stored for security purposes
- Sensitive data is not logged in details
- Personal information is masked in logs

### Data Retention
- Activity logs are retained for 365 days by default
- Automatic cleanup of old logs via `ActivityLogger.cleanupOldLogs()`
- Configurable retention period

## Performance Considerations

### Indexing
- Database indexes on `userId`, `action`, `resourceType`, and `createdAt`
- Efficient queries for filtering and pagination

### Async Logging
- Activity logging is performed asynchronously to avoid blocking requests
- Error handling ensures application continues even if logging fails

### Pagination
- Results are paginated to handle large datasets
- Configurable page sizes (default: 50 items per page)

## Monitoring and Maintenance

### Log Cleanup
```typescript
// Clean up logs older than 365 days
const deletedCount = await ActivityLogger.cleanupOldLogs(365);
```

### Statistics Generation
```typescript
// Get activity statistics for the last 30 days
const stats = await ActivityLogger.getStatistics(
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  new Date()
);
```

### User Activity Analysis
```typescript
// Get user activity summary for the last 7 days
const summary = await ActivityLogger.getUserActivitySummary(userId, 7);
```

## Testing

### Development Test Endpoint
- `POST /api/activity-logs/test` - Comprehensive test of all logging features
- Only available in development mode
- Requires administrator privileges

### Manual Testing
1. Perform various actions in the application
2. Check the activity logs in the admin interface
3. Verify that all actions are properly logged
4. Test filtering and pagination features

## Future Enhancements

1. **Real-time Activity Feed**: Live updates of activities
2. **Export Functionality**: Export logs to CSV/Excel
3. **Advanced Analytics**: Detailed usage analytics and reports
4. **Alerting System**: Notifications for suspicious activities
5. **Audit Trail Reports**: Formatted reports for compliance
6. **Activity Visualization**: Charts and graphs for activity patterns

## Troubleshooting

### Common Issues

1. **Missing Activity Logs**
   - Check if the user has proper permissions
   - Verify that the ActivityLogger is being called in the code
   - Check database connectivity

2. **Performance Issues**
   - Review database indexes
   - Consider implementing log archiving
   - Optimize query filters

3. **Access Denied Errors**
   - Verify user role permissions
   - Check authentication status
   - Review middleware configuration

### Debug Mode
Enable detailed logging by setting the log level to DEBUG in the environment configuration.

## Compliance

This activity logging system helps meet various compliance requirements:
- **Audit Trail**: Complete record of all user actions
- **Data Integrity**: Immutable log records
- **Access Control**: Role-based access to logs
- **Data Retention**: Configurable retention policies