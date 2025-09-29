import { youtubeUrlSchema } from './validations';

/**
 * YouTube utility functions for URL validation and embed code generation
 */

export interface YouTubeVideoInfo {
  videoId: string;
  url: string;
  embedUrl: string;
  thumbnailUrl: string;
  title?: string;
}

/**
 * Validates if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  try {
    youtubeUrlSchema.parse(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Remove any whitespace
  url = url.trim();

  // Regular expressions for different YouTube URL formats
  const patterns = [
    // Standard YouTube URLs
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // YouTube URLs with additional parameters
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    // YouTube embed URLs
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // YouTube shorts
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Generates YouTube embed URL from video ID
 */
export function generateYouTubeEmbedUrl(videoId: string, options?: {
  autoplay?: boolean;
  controls?: boolean;
  modestbranding?: boolean;
  rel?: boolean;
  start?: number;
}): string {
  const params = new URLSearchParams();
  
  if (options?.autoplay) params.set('autoplay', '1');
  if (options?.controls === false) params.set('controls', '0');
  if (options?.modestbranding) params.set('modestbranding', '1');
  if (options?.rel === false) params.set('rel', '0');
  if (options?.start) params.set('start', options.start.toString());

  const queryString = params.toString();
  return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Generates YouTube thumbnail URL from video ID
 */
export function generateYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string {
  const qualityMap = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    standard: 'sddefault.jpg',
    maxres: 'maxresdefault.jpg',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
}

/**
 * Processes YouTube URL and returns video information
 */
export function processYouTubeUrl(url: string): YouTubeVideoInfo | null {
  if (!isValidYouTubeUrl(url)) {
    return null;
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return null;
  }

  return {
    videoId,
    url,
    embedUrl: generateYouTubeEmbedUrl(videoId, {
      controls: true,
      modestbranding: true,
      rel: false,
    }),
    thumbnailUrl: generateYouTubeThumbnailUrl(videoId, 'medium'),
  };
}

/**
 * Validates and normalizes YouTube URL for storage
 */
export function normalizeYouTubeUrl(url: string): string | null {
  const videoInfo = processYouTubeUrl(url);
  if (!videoInfo) {
    return null;
  }

  // Return standard YouTube watch URL
  return `https://www.youtube.com/watch?v=${videoInfo.videoId}`;
}

/**
 * Gets YouTube video title (requires API key for full functionality)
 * This is a placeholder for future enhancement with YouTube Data API
 */
export async function getYouTubeVideoTitle(videoId: string): Promise<string | null> {
  // For now, return null. In the future, this could use YouTube Data API
  // to fetch video title and other metadata
  return null;
}

/**
 * Generates HTML embed code for YouTube video
 */
export function generateYouTubeEmbedHtml(videoId: string, options?: {
  width?: number;
  height?: number;
  responsive?: boolean;
}): string {
  const width = options?.width || 560;
  const height = options?.height || 315;
  const embedUrl = generateYouTubeEmbedUrl(videoId, {
    controls: true,
    modestbranding: true,
    rel: false,
  });

  if (options?.responsive) {
    return `
      <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
        <iframe 
          src="${embedUrl}"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
    `.trim();
  }

  return `
    <iframe 
      width="${width}" 
      height="${height}" 
      src="${embedUrl}"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  `.trim();
}