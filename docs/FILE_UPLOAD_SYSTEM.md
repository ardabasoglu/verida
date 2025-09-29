# File Upload and Management System

This document describes the file upload and management system implemented for the Verida corporate information application.

## Overview

The file upload system allows users to upload small files (up to 10MB) and attach them to pages. Files are stored using Coolify volume storage and managed through a comprehensive API and UI system.

## Features

### ✅ Implemented Features

1. **File Upload API** (`/api/files/upload`)
   - Supports PDF, Word, Excel, and image files
   - File type and extension validation
   - Size limit enforcement (10MB default)
   - Secure file storage with unique filenames
   - Role-based access control (Editor+ can upload)

2. **File Serving API** (`/api/files/[id]`)
   - Secure file download and viewing
   - Content-Type headers for proper browser handling
   - Download vs. inline viewing support
   - File access logging

3. **File Management API** (`/api/files`)
   - List files with filtering (by page, user)
   - Pagination support
   - File metadata retrieval

4. **File Deletion API** (`/api/files/[id]` DELETE)
   - Secure file deletion from database and disk
   - Permission checks (owner, admin, system admin)
   - Activity logging

5. **Page Integration**
   - File attachment to pages during creation/editing
   - File display in page viewer
   - File management in page forms

6. **UI Components**
   - `FileUpload`: Drag-and-drop file upload component
   - `FileList`: Display attached files with actions
   - `FileManager`: Comprehensive file management interface
   - `FileAttachments`: Display files in page viewer

## File Types and Limits

### Supported File Types
- **PDF**: `application/pdf` (.pdf)
- **Word Documents**: 
  - `application/msword` (.doc)
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)
- **Excel Spreadsheets**:
  - `application/vnd.ms-excel` (.xls)
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)
- **Images**:
  - `image/jpeg` (.jpg, .jpeg)
  - `image/png` (.png)
  - `image/gif` (.gif)
  - `image/webp` (.webp)

### File Size Limits
- **Maximum file size**: 10MB (configurable via `MAX_FILE_SIZE_MB` environment variable)
- **Storage location**: Coolify volume (`./uploads` directory by default)

## API Endpoints

### Upload File
```http
POST /api/files/upload
Content-Type: multipart/form-data

Body: FormData with 'file' field
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "file_id",
    "filename": "unique_filename.ext",
    "originalName": "original_name.ext",
    "mimeType": "application/pdf",
    "fileSize": 1024000,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get File
```http
GET /api/files/{id}?download=true  # Force download
GET /api/files/{id}                # Inline viewing
```

### List Files
```http
GET /api/files?pageId={pageId}&userId={userId}&page=1&limit=10
```

### Delete File
```http
DELETE /api/files/{id}
```

## Security Features

### Authentication & Authorization
- All file operations require authentication
- Upload requires Editor role or higher
- Delete requires file ownership or Admin+ role
- File access is logged for audit purposes

### File Validation
- MIME type validation against allowed types
- File extension validation to match MIME type
- File size validation against configured limits
- Filename sanitization and unique naming

### Storage Security
- Files stored outside web root
- Unique filenames prevent conflicts and guessing
- Access controlled through API endpoints only
- No direct file system access from web

## Environment Configuration

```bash
# File Upload Settings
UPLOAD_DIR="./uploads"           # Storage directory
MAX_FILE_SIZE_MB="10"           # Maximum file size in MB
```

## Database Schema

The file system uses the following database model:

```prisma
model File {
  id           String   @id @default(cuid())
  filename     String   // Unique filename on disk
  originalName String   // Original filename from user
  mimeType     String?  // MIME type for proper serving
  fileSize     BigInt   // File size in bytes
  filePath     String   // Full path to file on disk
  uploadedById String   // User who uploaded the file
  pageId       String?  // Optional page association
  createdAt    DateTime @default(now())

  uploadedBy User  @relation(fields: [uploadedById], references: [id])
  page       Page? @relation(fields: [pageId], references: [id])

  @@map("files")
}
```

## Usage Examples

### Basic File Upload Component
```tsx
import FileUpload from '@/components/editor/file-upload'

function MyComponent() {
  const handleFileUploaded = (file) => {
    console.log('File uploaded:', file)
  }

  return (
    <FileUpload onFileUploaded={handleFileUploaded} />
  )
}
```

### File Manager Component
```tsx
import FileManager from '@/components/files/file-manager'

function MyPage() {
  return (
    <FileManager
      pageId="page_123"
      allowUpload={true}
      allowDelete={true}
      showPageInfo={false}
    />
  )
}
```

### Display File Attachments
```tsx
import FileAttachments from '@/components/files/file-attachments'

function PageViewer({ page }) {
  return (
    <div>
      <h1>{page.title}</h1>
      <div>{page.content}</div>
      
      {page.files && page.files.length > 0 && (
        <FileAttachments files={page.files} />
      )}
    </div>
  )
}
```

## Setup Instructions

1. **Install Dependencies**: All required dependencies are already included in package.json

2. **Setup Upload Directory**:
   ```bash
   npm run setup:uploads
   ```

3. **Configure Environment**: Add file upload settings to your `.env` file

4. **Database Migration**: The File model is already included in the Prisma schema

## Testing

A test page is available at `/test-file-upload` to verify the file upload functionality:

- Test file upload with different file types
- Test file size limits
- Test file management operations
- Test API endpoints

## Troubleshooting

### Common Issues

1. **"File too large" error**
   - Check `MAX_FILE_SIZE_MB` environment variable
   - Verify file is within size limits

2. **"Unsupported file type" error**
   - Ensure file type is in the allowed list
   - Check file extension matches MIME type

3. **"Permission denied" error**
   - Verify user has Editor role or higher for uploads
   - Check file ownership for delete operations

4. **Files not found on disk**
   - Ensure upload directory exists and is writable
   - Check `UPLOAD_DIR` environment variable
   - Run `npm run setup:uploads` to create directory

### Logs and Debugging

- File operations are logged to the activity log
- Check server console for detailed error messages
- Use browser developer tools to inspect API responses

## Future Enhancements

Potential improvements for future versions:

1. **File Versioning**: Track file versions and changes
2. **Bulk Upload**: Support multiple file uploads at once
3. **File Preview**: Generate thumbnails for images and PDFs
4. **Cloud Storage**: Integration with cloud storage providers
5. **File Sharing**: Share files with external users
6. **Advanced Search**: Search within file contents
7. **File Categories**: Organize files into categories
8. **Compression**: Automatic file compression for large files

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **Requirement 3**: File attachment functionality for pages (görsel, dosya ekleme)
- **Requirement 9**: Secure file storage using Coolify volume for small files
- File type validation (PDF, Word, Excel) and size limits
- File download and serving endpoints
- Integration with page creation and editing workflow