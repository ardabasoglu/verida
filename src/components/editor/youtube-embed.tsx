'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { processYouTubeUrl, type YouTubeVideoInfo } from '@/lib/youtube-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface YouTubeEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmbed: (videoInfo: YouTubeVideoInfo) => void;
}

export function YouTubeEmbedModal({
  isOpen,
  onClose,
  onEmbed,
}: YouTubeEmbedModalProps) {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateUrl = useCallback(async (inputUrl: string) => {
    if (!inputUrl.trim()) {
      setVideoInfo(null);
      setError('');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const info = processYouTubeUrl(inputUrl);
      if (info) {
        setVideoInfo(info);
        setError('');
      } else {
        setVideoInfo(null);
        setError(
          'Geçerli bir YouTube URL&apos;si giriniz. Örnek: https://www.youtube.com/watch?v=VIDEO_ID'
        );
      }
    } catch {
      setVideoInfo(null);
      setError('URL işlenirken bir hata oluştu.');
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newUrl = e.target.value;
      setUrl(newUrl);
      validateUrl(newUrl);
    },
    [validateUrl]
  );

  const handleEmbed = useCallback(() => {
    if (videoInfo) {
      onEmbed(videoInfo);
      // Reset form
      setUrl('');
      setVideoInfo(null);
      setError('');
      onClose();
    }
  }, [videoInfo, onEmbed, onClose]);

  const handleClose = useCallback(() => {
    setUrl('');
    setVideoInfo(null);
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>YouTube Video Ekle</DialogTitle>
          <DialogDescription>
            YouTube video URL&apos;sini girin ve videoyu içeriğe ekleyin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              YouTube URL
            </label>
            <Input
              type="url"
              value={url}
              onChange={handleUrlChange}
              className={error ? 'border-red-300' : ''}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
            {isValidating && (
              <p className="text-muted-foreground text-sm mt-1">
                URL kontrol ediliyor...
              </p>
            )}
          </div>

          {/* Video Preview */}
          {videoInfo && (
            <div className="border border-border rounded-md p-3 bg-muted">
              <h4 className="text-sm font-medium text-foreground mb-2">
                Video Önizleme
              </h4>
              <div className="flex items-start space-x-3">
                <Image
                  src={videoInfo.thumbnailUrl}
                  alt="Video thumbnail"
                  width={80}
                  height={60}
                  className="w-20 h-15 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground break-all">
                    Video ID: {videoInfo.videoId}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bu video sayfanıza eklenecektir.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            <p className="font-medium mb-1">Desteklenen URL formatları:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
              <li>https://youtu.be/VIDEO_ID</li>
              <li>https://www.youtube.com/embed/VIDEO_ID</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            İptal
          </Button>
          <Button onClick={handleEmbed} disabled={!videoInfo || isValidating}>
            Video Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface YouTubePreviewProps {
  videoInfo: YouTubeVideoInfo;
  onRemove?: () => void;
  className?: string;
}

export function YouTubePreview({
  videoInfo,
  onRemove,
  className = '',
}: YouTubePreviewProps) {
  return (
    <div
      className={`group border-2 border-border/50 rounded-xl p-4 bg-background hover:border-blue-300 hover:shadow-sm transition-all duration-200 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="relative flex-shrink-0">
            <Image
              src={videoInfo.thumbnailUrl}
              alt="Video thumbnail"
              width={80}
              height={60}
              className="w-20 h-15 object-cover rounded-lg shadow-sm"
            />
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">▶</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-red-600 text-sm">📹</span>
              <p className="text-sm font-semibold text-foreground">YouTube Video</p>
            </div>
            <p className="text-xs text-muted-foreground break-all leading-relaxed">
              {videoInfo.url}
            </p>
            {videoInfo.title && (
              <p className="text-xs text-foreground font-medium mt-1 line-clamp-2">
                {videoInfo.title}
              </p>
            )}
          </div>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="Videoyu kaldır"
          >
            <span className="text-sm font-bold">×</span>
          </button>
        )}
      </div>
    </div>
  );
}
