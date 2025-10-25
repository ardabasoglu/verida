# Member Page View Feature

## Overview
A new page viewing experience has been implemented specifically for member users who don't have access to page management features. This provides a clean, focused interface for reading content without administrative distractions.

## Implementation

### New Routes
- `/view/[id]` - Clean page view for member users without sidebar or management features
- `/pages/[id]` - Existing admin view with sidebar and management features (for ADMIN/SYSTEM_ADMIN users)

### User Role-Based Routing
The application now automatically routes users to the appropriate page view based on their role:

- **ADMIN/SYSTEM_ADMIN users**: Directed to `/pages/[id]` (full management interface)
- **MEMBER users**: Directed to `/view/[id]` (clean reading interface)

### Key Features

#### Member Page Viewer (`/view/[id]`)
- **No sidebar**: Clean, distraction-free interface
- **Focused content**: Emphasizes the page content itself
- **Essential features only**:
  - Page content with proper HTML sanitization
  - File attachments
  - Comments section
  - Page metadata (author, date, type, tags)
- **Simple navigation**: Back to home button
- **Responsive design**: Optimized for reading on all devices

#### Updated Home Page Links
Both the published pages section and unread pages section now use role-based routing:
- Links automatically point to the appropriate view based on user role
- Maintains the same user experience while providing the right level of access

### Files Created/Modified

#### New Files
- `src/app/view/layout.tsx` - Layout without sidebar for member views
- `src/app/view/[id]/page.tsx` - Server component for individual page view
- `src/app/view/[id]/not-found.tsx` - 404 page for member view
- `src/components/pages/member-page-viewer.tsx` - Clean page viewer component

#### Modified Files
- `src/components/home/published-pages-section.tsx` - Added role-based routing
- `src/components/home/unread-pages-section.tsx` - Added role-based routing
- `src/components/layout/header.tsx` - Added brand name to header navigation

### Security
- Same authentication and domain restrictions apply
- Only published pages are visible to member users
- Page view logging is maintained for analytics

### Header Branding
The application header now displays the brand name "Verida" with "Kurumsal Bilgi Uygulaması" subtitle:
- **Responsive design**: Full text on desktop (md+), abbreviated on mobile
- **Clickable brand**: Links back to home page
- **Consistent placement**: Left side of header, next to theme toggle and user menu
- **Available everywhere**: Shows on all pages including member view pages

### Benefits
1. **Better UX for members**: Clean, focused reading experience
2. **Reduced confusion**: No access to management features they can't use
3. **Improved performance**: Lighter page load without sidebar components
4. **Brand visibility**: Clear brand identity in header navigation
5. **Maintainable**: Separate concerns between reading and management interfaces