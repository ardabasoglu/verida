-- Performance optimization indexes for Verida application

-- Pages table indexes
CREATE INDEX IF NOT EXISTS "pages_pageType_idx" ON "pages"("pageType");
CREATE INDEX IF NOT EXISTS "pages_authorId_idx" ON "pages"("authorId");
CREATE INDEX IF NOT EXISTS "pages_published_idx" ON "pages"("published");
CREATE INDEX IF NOT EXISTS "pages_createdAt_idx" ON "pages"("createdAt");
CREATE INDEX IF NOT EXISTS "pages_updatedAt_idx" ON "pages"("updatedAt");
CREATE INDEX IF NOT EXISTS "pages_pageType_published_idx" ON "pages"("pageType", "published");
CREATE INDEX IF NOT EXISTS "pages_authorId_published_idx" ON "pages"("authorId", "published");
CREATE INDEX IF NOT EXISTS "pages_createdAt_published_idx" ON "pages"("createdAt", "published");
CREATE INDEX IF NOT EXISTS "pages_title_idx" ON "pages"("title");

-- Files table indexes
CREATE INDEX IF NOT EXISTS "files_uploadedById_idx" ON "files"("uploadedById");
CREATE INDEX IF NOT EXISTS "files_pageId_idx" ON "files"("pageId");
CREATE INDEX IF NOT EXISTS "files_createdAt_idx" ON "files"("createdAt");
CREATE INDEX IF NOT EXISTS "files_mimeType_idx" ON "files"("mimeType");
CREATE INDEX IF NOT EXISTS "files_pageId_createdAt_idx" ON "files"("pageId", "createdAt");

-- Comments table indexes
CREATE INDEX IF NOT EXISTS "comments_pageId_idx" ON "comments"("pageId");
CREATE INDEX IF NOT EXISTS "comments_userId_idx" ON "comments"("userId");
CREATE INDEX IF NOT EXISTS "comments_createdAt_idx" ON "comments"("createdAt");
CREATE INDEX IF NOT EXISTS "comments_pageId_createdAt_idx" ON "comments"("pageId", "createdAt");

-- Activity logs table indexes
CREATE INDEX IF NOT EXISTS "activity_logs_userId_idx" ON "activity_logs"("userId");
CREATE INDEX IF NOT EXISTS "activity_logs_action_idx" ON "activity_logs"("action");
CREATE INDEX IF NOT EXISTS "activity_logs_resourceType_idx" ON "activity_logs"("resourceType");
CREATE INDEX IF NOT EXISTS "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "activity_logs_userId_createdAt_idx" ON "activity_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "activity_logs_action_createdAt_idx" ON "activity_logs"("action", "createdAt");

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX IF NOT EXISTS "notifications_userId_read_idx" ON "notifications"("userId", "read");
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- GIN indexes for array fields (tags)
CREATE INDEX IF NOT EXISTS "pages_tags_gin_idx" ON "pages" USING GIN ("tags");

-- Partial indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS "pages_published_true_createdAt_idx" ON "pages"("createdAt") WHERE "published" = true;
CREATE INDEX IF NOT EXISTS "notifications_unread_userId_idx" ON "notifications"("userId", "createdAt") WHERE "read" = false;