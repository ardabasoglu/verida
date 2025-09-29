# Search and Tagging System Documentation

## Overview

The Verida application includes a comprehensive search and tagging system that allows users to efficiently find and categorize content. The system provides full-text search capabilities, tag-based filtering, and advanced search options.

## Features

### 1. Full-Text Search
- Search across page titles, content, and tags
- Case-insensitive search
- Partial matching support
- Real-time search results

### 2. Tag Management
- Autocomplete tag suggestions based on existing tags
- Tag usage statistics
- Popular tags display
- Maximum 10 tags per page

### 3. Advanced Filtering
- Filter by page type (Info, Procedure, Announcement, Warning)
- Filter by tags (multiple tag selection)
- Filter by author
- Sort by relevance, date, or title
- Ascending/descending sort order

### 4. Search UI Components
- Enhanced search bar with autocomplete
- Advanced filters toggle
- Search results with highlighting
- Pagination support
- Mobile-responsive design

## API Endpoints

### Search API
```
GET /api/search
```

**Parameters:**
- `query` (string, optional): Search query text
- `pageType` (enum, optional): INFO | PROCEDURE | ANNOUNCEMENT | WARNING
- `tags` (array, optional): Array of tag names
- `authorId` (string, optional): Author user ID
- `page` (number, default: 1): Page number for pagination
- `limit` (number, default: 10, max: 50): Results per page
- `sortBy` (enum, default: relevance): relevance | date | title
- `sortOrder` (enum, default: desc): asc | desc

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "page_id",
      "title": "Page Title",
      "content": "Page content...",
      "pageType": "INFO",
      "tags": ["tag1", "tag2"],
      "author": {
        "id": "user_id",
        "name": "User Name",
        "email": "user@dgmgumruk.com"
      },
      "_count": {
        "comments": 5,
        "files": 2
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Tags API
```
GET /api/tags
```

**Parameters:**
- `query` (string, optional): Filter tags containing this text
- `limit` (number, default: 20, max: 100): Maximum tags to return

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tag": "javascript",
      "count": 15
    },
    {
      "tag": "security",
      "count": 8
    }
  ],
  "total": 2
}
```

### Popular Tags API
```
POST /api/tags
```

**Request Body:**
```json
{
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tag": "javascript",
      "count": 15
    }
  ]
}
```

## Components

### SearchBar Component
Located at: `src/components/search/search-bar.tsx`

**Props:**
- `onSearch`: Callback function when search is performed
- `initialQuery`: Initial search query
- `initialFilters`: Initial filter values
- `showAdvancedFilters`: Whether to show advanced filters

**Features:**
- Real-time tag autocomplete
- Advanced filters toggle
- Clear filters functionality
- Mobile-responsive design

### SearchResults Component
Located at: `src/components/search/search-results.tsx`

**Props:**
- `results`: Array of search results
- `loading`: Loading state
- `error`: Error message
- `pagination`: Pagination data
- `onPageChange`: Page change callback
- `searchQuery`: Current search query for highlighting

**Features:**
- Search term highlighting
- Page type icons and colors
- Pagination controls
- Empty state handling
- Loading states

### TagInput Component
Located at: `src/components/forms/tag-input.tsx`

**Props:**
- `tags`: Current tags array
- `onChange`: Callback when tags change
- `placeholder`: Input placeholder text
- `maxTags`: Maximum number of tags (default: 10)
- `suggestions`: Optional tag suggestions

**Features:**
- Tag autocomplete with API integration
- Tag removal functionality
- Keyboard navigation (Enter to add, Backspace to remove)
- Visual tag display with counts

## Usage Examples

### Basic Search
```typescript
// Navigate to search page with query
router.push('/search?q=javascript')

// Use SearchBar component
<SearchBar
  onSearch={(params) => {
    console.log('Search:', params.query)
    console.log('Filters:', params.filters)
  }}
  showAdvancedFilters={true}
/>
```

### Advanced Search with Filters
```typescript
// Search with multiple filters
const searchParams = {
  query: 'security',
  filters: {
    pageType: 'PROCEDURE',
    tags: ['security', 'guidelines'],
    sortBy: 'date',
    sortOrder: 'desc'
  }
}
```

### Tag Management
```typescript
// Use TagInput in forms
<TagInput
  tags={formData.tags}
  onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
  placeholder="Add tags..."
  maxTags={10}
/>
```

## Database Schema

The search system uses the existing Page model with the following relevant fields:

```prisma
model Page {
  id          String      @id @default(cuid())
  title       String      // Searchable
  content     String?     // Searchable
  pageType    ContentType // Filterable
  tags        String[]    // Searchable and filterable
  published   Boolean     @default(true)
  authorId    String      // Filterable
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  author   User      @relation(fields: [authorId], references: [id])
  // ... other relations
}
```

## Search Algorithm

The search system uses the following priority for relevance:

1. **Title matches** - Highest priority
2. **Content matches** - Medium priority  
3. **Tag matches** - Medium priority
4. **Creation date** - Fallback sorting

### Search Query Processing

1. **Text Search**: Uses PostgreSQL `ILIKE` for case-insensitive partial matching
2. **Tag Search**: Uses Prisma's `hasSome` for array matching
3. **Combined Search**: Uses `AND`/`OR` logic for multiple criteria
4. **Filtering**: Applied after text search for performance

## Performance Considerations

### Database Indexes
Recommended indexes for optimal performance:

```sql
-- Full-text search on title and content
CREATE INDEX idx_pages_title_search ON pages USING gin(to_tsvector('english', title));
CREATE INDEX idx_pages_content_search ON pages USING gin(to_tsvector('english', content));

-- Tag array search
CREATE INDEX idx_pages_tags ON pages USING gin(tags);

-- Common filters
CREATE INDEX idx_pages_type_published ON pages(page_type, published);
CREATE INDEX idx_pages_author_published ON pages(author_id, published);
CREATE INDEX idx_pages_created_at ON pages(created_at DESC);
```

### Caching Strategy
- Tag suggestions are cached for 5 minutes
- Popular tags are cached for 1 hour
- Search results use browser caching with ETags

## Testing

Run the search functionality tests:

```bash
npx tsx scripts/tests/test-search-functionality.ts
```

The test covers:
- Text search functionality
- Tag-based filtering
- Page type filtering
- Tag aggregation
- Combined search filters
- Pagination
- Database performance

## Security

### Input Validation
- All search parameters are validated using Zod schemas
- SQL injection prevention through Prisma ORM
- XSS prevention through content sanitization

### Access Control
- Search requires authentication
- Users can only search published pages
- Role-based filtering for sensitive content

## Future Enhancements

### Planned Features
1. **Elasticsearch Integration** - For advanced full-text search
2. **Search Analytics** - Track popular searches and improve relevance
3. **Saved Searches** - Allow users to save and reuse search queries
4. **Search Suggestions** - Auto-suggest search queries based on content
5. **Faceted Search** - Dynamic filter options based on results
6. **Search Highlighting** - Better highlighting of search terms in results

### Performance Improvements
1. **Search Result Caching** - Cache frequent search results
2. **Incremental Search** - Real-time search as user types
3. **Search Index Optimization** - Custom search indexes for better performance
4. **Result Prefetching** - Preload next page of results

## Troubleshooting

### Common Issues

1. **No search results**
   - Check if pages are published
   - Verify search query spelling
   - Try broader search terms

2. **Slow search performance**
   - Check database indexes
   - Monitor query execution time
   - Consider result caching

3. **Tag autocomplete not working**
   - Verify `/api/tags` endpoint is accessible
   - Check network requests in browser dev tools
   - Ensure proper authentication

### Debug Mode
Enable debug logging by setting:
```env
SEARCH_DEBUG=true
```

This will log all search queries and performance metrics.