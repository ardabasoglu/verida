import { type YouTubeVideoInfo } from './youtube-utils';

/**
 * Extract YouTube videos from HTML content
 */
export function extractYouTubeVideosFromContent(content: string): YouTubeVideoInfo[] {
  // More flexible regex that handles whitespace and attributes in any order
  const videoRegex = /<div[^>]*class="youtube-video-embed"[^>]*data-video-id="([^"]+)"[^>]*>/g;
  const videos: YouTubeVideoInfo[] = [];
  let match;
  
  while ((match = videoRegex.exec(content)) !== null) {
    const videoId = match[1];
    if (videoId) {
      videos.push({
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      });
    }
  }
  
  // Also try alternative pattern in case attributes are in different order
  if (videos.length === 0) {
    const altRegex = /<div[^>]*data-video-id="([^"]+)"[^>]*class="youtube-video-embed"[^>]*>/g;
    let altMatch;
    while ((altMatch = altRegex.exec(content)) !== null) {
      const videoId = altMatch[1];
      if (videoId) {
        videos.push({
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        });
      }
    }
  }
  
  return videos;
}

/**
 * Remove YouTube video embeds from content for editing
 */
export function cleanContentFromYouTubeEmbeds(content: string): string {
  return content.replace(/<div class="youtube-video-embed"[^>]*>.*?<\/div>/g, '').trim();
}

/**
 * Embed YouTube videos into content
 */
export function embedYouTubeVideosIntoContent(content: string, videos: YouTubeVideoInfo[]): string {
  if (!videos || videos.length === 0) {
    return content;
  }

  const videoEmbeds = videos.map(video => 
    `<div class="youtube-video-embed" data-video-id="${video.videoId}" style="margin: 20px 0; position: relative; width: 100%; padding-bottom: 56.25%; height: 0;">
      <iframe src="${video.embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 8px;" allowfullscreen title="YouTube video ${video.videoId}"></iframe>
    </div>`
  ).join('\n');
  
  // Add videos after the content with proper spacing
  return content ? `${content}\n\n${videoEmbeds}` : videoEmbeds;
}