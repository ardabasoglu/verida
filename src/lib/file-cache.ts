/**
 * File caching and optimization utilities
 * Provides efficient file serving with proper caching headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';


/**
 * File cache configuration
 */
const FILE_CACHE_CONFIG = {
  // Cache durations in seconds
  IMAGE_CACHE_DURATION: 31536000, // 1 year for images
  DOCUMENT_CACHE_DURATION: 86400, // 1 day for documents
  DEFAULT_CACHE_DURATION: 3600, // 1 hour default

  // File type mappings
  IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],

  // Compression threshold (bytes)
  COMPRESSION_THRESHOLD: 1024, // 1KB
};

/**
 * Generate optimized cache headers based on file type
 */
export function generateCacheHeaders(
  mimeType: string,
  fileSize: number
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Determine cache duration based on file type
  let cacheDuration = FILE_CACHE_CONFIG.DEFAULT_CACHE_DURATION;

  if (FILE_CACHE_CONFIG.IMAGE_TYPES.includes(mimeType)) {
    cacheDuration = FILE_CACHE_CONFIG.IMAGE_CACHE_DURATION;
  } else if (FILE_CACHE_CONFIG.DOCUMENT_TYPES.includes(mimeType)) {
    cacheDuration = FILE_CACHE_CONFIG.DOCUMENT_CACHE_DURATION;
  }

  // Set cache control headers
  headers['Cache-Control'] = `public, max-age=${cacheDuration}, immutable`;
  headers['Expires'] = new Date(
    Date.now() + cacheDuration * 1000
  ).toUTCString();

  // Add ETag for cache validation
  headers['ETag'] = `"${Date.now()}-${fileSize}"`;

  // Enable compression for text-based files
  if (fileSize > FILE_CACHE_CONFIG.COMPRESSION_THRESHOLD) {
    if (
      mimeType.startsWith('text/') ||
      mimeType.includes('json') ||
      mimeType.includes('xml')
    ) {
      headers['Vary'] = 'Accept-Encoding';
    }
  }

  return headers;
}

/**
 * Check if client has cached version
 */
export function checkClientCache(
  request: NextRequest,
  etag: string,
  lastModified: Date
): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  const ifModifiedSince = request.headers.get('if-modified-since');

  // Check ETag
  if (ifNoneMatch && ifNoneMatch === etag) {
    return true;
  }

  // Check Last-Modified
  if (ifModifiedSince) {
    const clientDate = new Date(ifModifiedSince);
    if (clientDate >= lastModified) {
      return true;
    }
  }

  return false;
}

/**
 * Create optimized file response
 */
export async function createFileResponse(
  filePath: string,
  mimeType: string,
  originalName: string,
  download = false
): Promise<NextResponse> {
  try {
    // Get file stats
    const stats = await stat(filePath);
    const fileSize = stats.size;
    const lastModified = stats.mtime;

    // Generate cache headers
    const cacheHeaders = generateCacheHeaders(mimeType, fileSize);

    // Read file
    const fileBuffer = await readFile(filePath);

    // Create response headers
    const headers = new Headers();

    // Set content headers
    headers.set('Content-Type', mimeType || 'application/octet-stream');
    headers.set('Content-Length', fileSize.toString());
    headers.set('Last-Modified', lastModified.toUTCString());

    // Set cache headers
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    // Set content disposition
    const disposition = download ? 'attachment' : 'inline';
    headers.set(
      'Content-Disposition',
      `${disposition}; filename="${originalName}"`
    );

    // Security headers for file serving
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');

    // Create response
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    });
  } catch {
    console.error('Error creating file response');
    return new NextResponse('File not found', { status: 404 });
  }
}

/**
 * Create 304 Not Modified response
 */
export function createNotModifiedResponse(): NextResponse {
  return new NextResponse(null, {
    status: 304,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

/**
 * Optimize image serving with basic compression info
 */
export function getImageOptimizationHeaders(
  mimeType: string
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Add image-specific headers
  if (FILE_CACHE_CONFIG.IMAGE_TYPES.includes(mimeType)) {
    headers['Accept-Ranges'] = 'bytes';

    // Suggest modern formats
    if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
      headers['Vary'] = 'Accept';
    }
  }

  return headers;
}

/**
 * File serving middleware with caching
 */
export async function serveFileWithCache(
  request: NextRequest,
  filePath: string,
  mimeType: string,
  originalName: string,
  download = false
): Promise<NextResponse> {
  try {
    // Get file stats for cache validation
    const stats = await stat(filePath);
    const lastModified = stats.mtime;
    const etag = `"${stats.mtime.getTime()}-${stats.size}"`;

    // Check if client has cached version
    if (checkClientCache(request, etag, lastModified)) {
      return createNotModifiedResponse();
    }

    // Serve file with optimized headers
    return createFileResponse(filePath, mimeType, originalName, download);
  } catch {
    console.error('Error serving file');
    return new NextResponse('File not found', { status: 404 });
  }
}


