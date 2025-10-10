'use client'

import { useState, useCallback } from 'react';
import { YouTubeEmbedModal, YouTubePreview } from '../editor/youtube-embed';
import { type YouTubeVideoInfo } from '@/lib/youtube-utils';

interface YouTubeVideoManagerProps {
  videos: YouTubeVideoInfo[];
  onVideosChange: (videos: YouTubeVideoInfo[]) => void;
  className?: string;
  maxVideos?: number;
}

export function YouTubeVideoManager({
  videos,
  onVideosChange,
  className = '',
  maxVideos = 10
}: YouTubeVideoManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddVideo = useCallback((videoInfo: YouTubeVideoInfo) => {
    // Check if video already exists
    const exists = videos.some(v => v.videoId === videoInfo.videoId);
    if (exists) {
      alert('Bu video zaten eklenmiş.');
      return;
    }

    // Check max videos limit
    if (videos.length >= maxVideos) {
      alert(`En fazla ${maxVideos} video ekleyebilirsiniz.`);
      return;
    }

    onVideosChange([...videos, videoInfo]);
  }, [videos, onVideosChange, maxVideos]);

  const handleRemoveVideo = useCallback((videoId: string) => {
    onVideosChange(videos.filter(v => v.videoId !== videoId));
  }, [videos, onVideosChange]);

  const canAddMore = videos.length < maxVideos;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          YouTube Videoları ({videos.length}/{maxVideos})
        </h4>
        {canAddMore && videos.length > 0 && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <span>📹</span>
            Video Ekle
          </button>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-muted/20">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">📹</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Henüz video eklenmemiş
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                YouTube videolarını sayfanıza ekleyerek içeriğinizi zenginleştirin
              </p>
            </div>
            {canAddMore && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <span>📹</span>
                İlk Videoyu Ekle
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <YouTubePreview
              key={video.videoId}
              videoInfo={video}
              onRemove={() => handleRemoveVideo(video.videoId)}
            />
          ))}
        </div>
      )}

      <YouTubeEmbedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEmbed={handleAddVideo}
      />
    </div>
  );
}

interface YouTubeVideoDisplayProps {
  videoInfo: YouTubeVideoInfo;
  className?: string;
  responsive?: boolean;
}

export function YouTubeVideoDisplay({
  videoInfo,
  className = '',
  responsive = true
}: YouTubeVideoDisplayProps) {
  const embedUrl = videoInfo.embedUrl;

  if (responsive) {
    return (
      <div className={`relative w-full ${className}`} style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`YouTube video ${videoInfo.videoId}`}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <iframe
        src={embedUrl}
        width="640"
        height="480"
        className="rounded-lg max-w-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={`YouTube video ${videoInfo.videoId}`}
      />
    </div>
  );
}

interface YouTubeVideoListProps {
  videos: YouTubeVideoInfo[];
  className?: string;
  responsive?: boolean;
  showTitles?: boolean;
}

export function YouTubeVideoList({
  videos,
  className = '',
  responsive = true,
  showTitles = false
}: YouTubeVideoListProps) {
  if (videos.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {videos.map((video, index) => (
        <div key={video.videoId} className="space-y-2">
          {showTitles && (
            <h4 className="text-lg font-medium text-foreground">
              {video.title || `Video ${index + 1}`}
            </h4>
          )}
          <YouTubeVideoDisplay
            videoInfo={video}
            responsive={responsive}
          />
        </div>
      ))}
    </div>
  );
}