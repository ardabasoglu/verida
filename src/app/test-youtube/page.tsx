'use client';

import { useState } from 'react';
import {
  YouTubeEmbedModal,
  YouTubePreview,
} from '@/components/editor/youtube-embed';
import {
  YouTubeVideoManager,
  YouTubeVideoDisplay,
  YouTubeVideoList,
} from '@/components/pages/youtube-video-manager';
import {
  processYouTubeUrl,
  isValidYouTubeUrl,
  extractYouTubeVideoId,
  generateYouTubeEmbedUrl,
  type YouTubeVideoInfo,
} from '@/lib/youtube-utils';

export default function TestYouTubePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videos, setVideos] = useState<YouTubeVideoInfo[]>([]);
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<string>('');

  const handleAddVideo = (videoInfo: YouTubeVideoInfo) => {
    setVideos((prev) => [...prev, videoInfo]);
  };

  const testYouTubeUrl = () => {
    if (!testUrl) {
      setTestResult('URL giriniz');
      return;
    }

    const isValid = isValidYouTubeUrl(testUrl);
    const videoId = extractYouTubeVideoId(testUrl);
    const processedInfo = processYouTubeUrl(testUrl);

    setTestResult(
      `
URL: ${testUrl}
Geçerli: ${isValid ? 'Evet' : 'Hayır'}
Video ID: ${videoId || 'Bulunamadı'}
Embed URL: ${processedInfo ? processedInfo.embedUrl : 'Oluşturulamadı'}
Thumbnail: ${processedInfo ? processedInfo.thumbnailUrl : 'Oluşturulamadı'}
    `.trim()
    );
  };

  const sampleVideos: YouTubeVideoInfo[] = [
    {
      videoId: 'dQw4w9WgXcQ',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embedUrl: generateYouTubeEmbedUrl('dQw4w9WgXcQ'),
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      title: 'Rick Astley - Never Gonna Give You Up',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          YouTube Video Test Sayfası
        </h1>

        {/* URL Test Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">URL Validation Test</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="YouTube URL'si girin..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={testYouTubeUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Test Et
              </button>
            </div>
            {testResult && (
              <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap">
                {testResult}
              </pre>
            )}
          </div>
        </div>

        {/* Sample URLs for testing */}
        <div className="mb-8">
          <h3 className="text-md font-semibold mb-2">Test URL&apos;leri:</h3>
          <div className="space-y-1 text-sm">
            <button
              onClick={() =>
                setTestUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
              }
              className="block text-blue-600 hover:underline"
            >
              https://www.youtube.com/watch?v=dQw4w9WgXcQ
            </button>
            <button
              onClick={() => setTestUrl('https://youtu.be/dQw4w9WgXcQ')}
              className="block text-blue-600 hover:underline"
            >
              https://youtu.be/dQw4w9WgXcQ
            </button>
            <button
              onClick={() =>
                setTestUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')
              }
              className="block text-blue-600 hover:underline"
            >
              https://www.youtube.com/embed/dQw4w9WgXcQ
            </button>
            <button
              onClick={() => setTestUrl('https://invalid-url.com')}
              className="block text-red-600 hover:underline"
            >
              https://invalid-url.com (Geçersiz URL)
            </button>
          </div>
        </div>

        {/* Video Manager Test */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Video Manager Test</h2>
          <YouTubeVideoManager
            videos={videos}
            onVideosChange={setVideos}
            maxVideos={3}
          />
        </div>

        {/* Sample Video Display */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Sample Video Display</h2>
          <YouTubeVideoList
            videos={sampleVideos}
            responsive={true}
            showTitles={true}
          />
        </div>

        {/* Individual Video Display */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Individual Video Display (Fixed Size)
          </h2>
          {sampleVideos[0] && (
            <YouTubeVideoDisplay
              videoInfo={sampleVideos[0]}
              responsive={false}
            />
          )}
        </div>

        {/* Modal Test */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Modal Test</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            YouTube Modal Aç
          </button>
        </div>

        {/* Added Videos List */}
        {videos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">
              Eklenen Videolar ({videos.length})
            </h2>
            <YouTubeVideoList
              videos={videos}
              responsive={true}
              showTitles={false}
            />
          </div>
        )}
      </div>

      <YouTubeEmbedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEmbed={handleAddVideo}
      />
    </div>
  );
}
