'use client'

import { useState } from 'react';
import RichTextEditor from '@/components/editor/rich-text-editor';
import { YouTubeVideoManager } from '@/components/pages/youtube-video-manager';
import { processYouTubeUrl, type YouTubeVideoInfo } from '@/lib/youtube-utils';

export default function TestYouTubeIntegrationPage() {
  const [content, setContent] = useState('<p>Bu sayfada YouTube video entegrasyonunu test edebilirsiniz.</p>');
  const [videos, setVideos] = useState<YouTubeVideoInfo[]>([]);

  const addSampleVideo = () => {
    const sampleUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const videoInfo = processYouTubeUrl(sampleUrl);
    if (videoInfo) {
      setVideos(prev => [...prev, videoInfo]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          YouTube Integration Test
        </h1>

        {/* Rich Text Editor with YouTube Support */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Rich Text Editor (TipTap with YouTube)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Editörde YouTube video eklemek için 📹 butonunu kullanın.
          </p>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="YouTube videoları ekleyebilirsiniz..."
          />
        </div>

        {/* Video Manager */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">YouTube Video Manager</h2>
          <p className="text-sm text-gray-600 mb-4">
            Ayrı bir video yöneticisi ile de videolar ekleyebilirsiniz.
          </p>
          <YouTubeVideoManager
            videos={videos}
            onVideosChange={setVideos}
            maxVideos={3}
          />
          <button
            onClick={addSampleVideo}
            className="mt-2 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Örnek Video Ekle
          </button>
        </div>

        {/* Content Preview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Content Preview</h2>
          <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-md font-semibold text-blue-900 mb-2">Test Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Rich text editörde 📹 butonuna tıklayın</li>
            <li>2. Geçerli bir YouTube URL&apos;si girin (örn: https://www.youtube.com/watch?v=dQw4w9WgXcQ)</li>
            <li>3. Video önizlemesini kontrol edin</li>
            <li>4. &quot;Video Ekle&quot; butonuna tıklayın</li>
            <li>5. Video Manager&apos;da da video eklemeyi test edin</li>
            <li>6. Content Preview&apos;da videoların doğru görüntülendiğini kontrol edin</li>
          </ul>
        </div>

        {/* Supported URL Formats */}
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="text-md font-semibold text-green-900 mb-2">Desteklenen URL Formatları</h3>
          <ul className="text-sm text-green-800 space-y-1 font-mono">
            <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
            <li>• https://youtu.be/VIDEO_ID</li>
            <li>• https://www.youtube.com/embed/VIDEO_ID</li>
            <li>• https://www.youtube.com/shorts/VIDEO_ID</li>
          </ul>
        </div>
      </div>
    </div>
  );
}