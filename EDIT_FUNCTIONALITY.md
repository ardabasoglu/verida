# Page Edit Functionality

## Overview
Users can now edit pages directly from the view page by clicking the "Düzenle" (Edit) button. This functionality is available for users who have permission to edit the page, including editors who cannot access the admin `/pages` routes.

## How It Works

### 1. Edit Button Display
- The edit button appears in the top-right corner of the page view
- Only visible to users who can edit the page:
  - Page author
  - Users with EDITOR role
  - Users with ADMIN role
  - Users with SYSTEM_ADMIN role

### 2. Permission Check
The edit permission is checked both on the frontend and backend:
- Frontend: Button visibility is controlled by the `canEdit` variable in `MemberPageViewer`
- Backend: API endpoint validates permissions before allowing updates

### 3. Edit Flow
1. User clicks "Düzenle" button on view page (`/view/[id]`)
2. User is redirected to edit page (`/view/[id]/edit`) - **Note: This is different from admin routes**
3. Form is pre-populated with existing page data
4. User makes changes and submits
5. Page is updated via PUT request to `/api/pages/[id]`
6. User is redirected back to the page view (`/view/[id]`)

## Files Modified

### `src/components/pages/member-page-viewer.tsx`
- Added Edit icon import
- Added `canEdit` permission check using `useMemo` (includes EDITOR role)
- Added edit button in navigation section
- Button links to `/view/[id]/edit` (view-based edit route)

### `src/app/api/pages/[id]/route.ts`
- Updated permission checks to include EDITOR role
- Updated error messages to mention editors

### `src/components/forms/page-form.tsx`
- Updated redirect after editing to go back to view page instead of admin pages

### New Files Created
- `src/app/view/[id]/edit/page.tsx` - Edit page route for view context (inherits layout from parent /view route)

### Existing Files Used
- `src/components/forms/page-form.tsx` - Form component for editing
- `src/app/api/pages/[id]/route.ts` - API endpoint for updates

## Usage

### For Regular Users
- View any page at `http://localhost:3001/view/[page-id]`
- If you're the author or have admin privileges, you'll see an "Düzenle" button
- Click the button to edit the page content

### For Developers
The edit functionality is fully integrated with the existing system:
- Uses the same form component for create and edit
- Maintains all existing validation and security checks
- Preserves file attachments and other page metadata
- Sends notifications for page updates (announcements and warnings)

## Security
- Domain restriction: Only users with `@dgmgumruk.com` email addresses can access
- Role-based permissions: Only authors, editors, admins, and system admins can edit
- Session validation: Requires valid authentication session
- Input validation: All form data is validated on both client and server
- Route separation: Editors use `/view/[id]/edit` instead of admin-only `/pages/[id]/edit`

## Role-Based Access

### Admin Routes (`/pages/*`)
- Intended for administrators and system admins
- Full page management capabilities
- Access to page statistics and advanced features

### View-Based Edit Routes (`/view/[id]/edit`)
- Accessible by editors, admins, and page authors
- Focused on content editing
- Redirects back to view page after editing
- No access to admin-only features

## Testing
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3001/view/[existing-page-id]`
3. If you have edit permissions (EDITOR, ADMIN, SYSTEM_ADMIN, or page author), you should see the "Düzenle" button
4. Click the button to test the edit functionality
5. Verify that after editing, you're redirected back to the view page