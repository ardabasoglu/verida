# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Verida application.

## Overview

The performance optimization implementation includes:
1. Database query optimization with proper indexing
2. In-memory caching strategies for frequently accessed data
3. Optimized file serving with proper caching headers
4. Performance monitoring and metrics collection

## Database Optimizations

### Indexes Added

The following indexes have been added to improve query performance:

#### Pages Table
- `pageType` - For filtering by content type
- `authorId` - For author-based queries
- `published` - For published content filtering
- `createdAt` - For date-based sorting
- `updatedAt` - For recently updated content
- `title` - For title-based searches
- Composite indexes for common query patterns
- GIN index on `tags` array for tag-based searches

#### Files Table
- `uploadedById` - For user file queries
- `pageId` - For page-related files
- `createdAt` - For chronological ordering
- `mimeType` - For file type filtering

#### Comments Table
- `pageId` - For page comments
- `userId` - For user comments
- `createdAt` - For chronological ordering

#### Activity Logs Table
- `userId` - For user activity tracking
- `action` - For action-based filtering
- `resourceType` - For resource type filtering
- `createdAt` - For time-based queries

#### Notifications Table
- `userId` - For user notifications
- `read` - For unread notifications
- `type` - For notification type filtering
- `createdAt` - For chronological ordering

### Query Optimization Strategies

1. **Selective Field Loading**: Only load required fields using `select`
2. **Relation Optimization**: Use `include` with selective field loading
3. **Pagination**: Implement proper pagination with `skip` and `take`
4. **Parallel Queries**: Use `Promise.all` for independent queries
5. **Indexed Filtering**: Ensure all WHERE clauses use indexed fields

## Caching Implementation

### Cache Types

1. **Page Cache**: Stores individual pages and page lists (10-minute TTL)
2. **Search Cache**: Stores search results (5-minute TTL)
3. **User Cache**: Stores user data (15-minute TTL)
4. **Stats Cache**: Stores application statistics (30-minute TTL)

### Cache Features

- **LRU-like Behavior**: Automatic eviction of old entries
- **TTL Support**: Time-based expiration
- **Cache Invalidation**: Smart invalidation on data changes
- **Memory Management**: Configurable size limits

### Cache Keys

Structured cache keys for easy management:
- `page:{id}` - Individual pages
- `pages:{params}` - Page lists
- `search:{params}` - Search results
- `user:{id}` - User data
- `stats:global` - Global statistics

## File Serving Optimization

### Caching Headers

- **Long-term Caching**: 1 year for images, 1 day for documents
- **ETag Support**: For cache validation
- **Conditional Requests**: Support for If-None-Match headers
- **Compression**: Automatic compression for text-based files

### File Type Optimization

- **Image Files**: Long-term caching with immutable flag
- **Document Files**: Medium-term caching
- **Security Headers**: Proper security headers for file serving

## Performance Monitoring

### Metrics Collected

- Query execution times
- Cache hit rates
- Slow query detection
- API endpoint performance

### Monitoring Features

- **Real-time Tracking**: Live performance metrics
- **Slow Query Detection**: Automatic logging of slow queries
- **Cache Analytics**: Cache hit rate and efficiency metrics
- **Performance Reports**: Comprehensive performance analysis

### API Endpoints

- `GET /api/performance` - Get performance metrics (Admin only)
- `DELETE /api/performance` - Clear metrics and cache (System Admin only)

## Usage Guidelines

### For Developers

1. **Use Optimized Queries**: Always use the query classes in `query-optimizer.ts`
2. **Cache Invalidation**: Properly invalidate caches when data changes
3. **Performance Monitoring**: Monitor query performance in development
4. **Index Usage**: Ensure queries use available indexes

### For Administrators

1. **Monitor Performance**: Regularly check performance metrics
2. **Cache Management**: Monitor cache hit rates and adjust TTL as needed
3. **Database Maintenance**: Regular index maintenance and query optimization
4. **Resource Monitoring**: Monitor memory usage and database performance

## Configuration

### Cache Configuration

```typescript
// Default cache settings
const CACHE_CONFIG = {
  pageCache: { maxSize: 500, defaultTTL: 10 * 60 * 1000 }, // 10 minutes
  searchCache: { maxSize: 200, defaultTTL: 5 * 60 * 1000 }, // 5 minutes
  userCache: { maxSize: 100, defaultTTL: 15 * 60 * 1000 }, // 15 minutes
  statsCache: { maxSize: 50, defaultTTL: 30 * 60 * 1000 }  // 30 minutes
}
```

### File Caching Configuration

```typescript
const FILE_CACHE_CONFIG = {
  IMAGE_CACHE_DURATION: 31536000, // 1 year
  DOCUMENT_CACHE_DURATION: 86400, // 1 day
  DEFAULT_CACHE_DURATION: 3600,   // 1 hour
  COMPRESSION_THRESHOLD: 1024     // 1KB
}
```

## Performance Best Practices

### Database Queries

1. Always use indexed fields in WHERE clauses
2. Limit result sets with proper pagination
3. Use selective field loading to reduce data transfer
4. Implement proper sorting on indexed fields
5. Use composite indexes for multi-field queries

### Caching Strategy

1. Cache frequently accessed data
2. Use appropriate TTL values based on data volatility
3. Implement proper cache invalidation
4. Monitor cache hit rates and adjust strategies
5. Use cache warming for critical data

### File Serving

1. Use proper caching headers for static files
2. Implement conditional requests for bandwidth optimization
3. Use compression for text-based files
4. Set appropriate cache durations based on file types
5. Implement proper security headers

## Monitoring and Maintenance

### Regular Tasks

1. **Performance Review**: Weekly performance metric analysis
2. **Cache Optimization**: Monthly cache hit rate review
3. **Index Maintenance**: Quarterly database index analysis
4. **Query Optimization**: Ongoing slow query identification and optimization

### Alerts and Thresholds

- Slow queries > 1 second
- Cache hit rate < 50%
- Average response time > 500ms
- Memory usage > 80%

## Troubleshooting

### Common Issues

1. **Low Cache Hit Rate**: Check cache TTL and invalidation logic
2. **Slow Queries**: Verify index usage and query optimization
3. **High Memory Usage**: Review cache size limits and cleanup intervals
4. **File Serving Issues**: Check file permissions and caching headers

### Debugging Tools

- Performance monitoring API
- Cache statistics endpoint
- Database query analysis
- Application logs and metrics

## Future Improvements

### Potential Enhancements

1. **Redis Integration**: External caching for multi-instance deployments
2. **CDN Integration**: Content delivery network for static files
3. **Database Connection Pooling**: Optimized database connections
4. **Query Result Streaming**: Large result set optimization
5. **Advanced Caching**: Intelligent cache warming and prefetching