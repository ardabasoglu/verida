'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RichTextEditor from '@/components/editor/rich-text-editor';

import { ContentType } from '@prisma/client';



export default function TestEditorPage() {
  const [formData, setFormData] = useState({
    title: 'Test Page',
    content: '<p>Start typing your content here...</p>',
    pageType: 'INFO' as ContentType,
    tags: ['test', 'editor'],
  });



  const handleSave = () => {
    console.log('Form Data:', formData);
    alert('Content saved to console! Check browser dev tools.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Rich Text Editor Test Page
          </h1>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Başlık
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Sayfa başlığını giriniz"
              />
            </div>

            {/* Page Type */}
            <div>
              <label
                htmlFor="pageType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sayfa Tipi
              </label>
              <Select
                value={formData.pageType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    pageType: value as ContentType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sayfa tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">Bilgi</SelectItem>
                  <SelectItem value="PROCEDURE">Prosedür</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Duyuru</SelectItem>
                  <SelectItem value="WARNING">Uyarı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İçerik
              </label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) =>
                  setFormData((prev) => ({ ...prev, content }))
                }
                placeholder="Sayfa içeriğinizi yazın..."
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosya Ekleri (Test Mode - Files won&apos;t actually upload)
              </label>
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-md">
                <p className="text-sm text-gray-500 mb-2">
                  File upload is disabled in test mode. In the real app, you
                  would be able to upload:
                </p>
                <ul className="text-xs text-gray-400 list-disc list-inside">
                  <li>PDF documents</li>
                  <li>Word documents (.doc, .docx)</li>
                  <li>Excel spreadsheets (.xls, .xlsx)</li>
                  <li>Images (JPEG, PNG, GIF, WebP)</li>
                </ul>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiketler
              </label>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="flex items-center">
                    <Badge
                      label={tag}
                      color="blue"
                      className="text-sm px-3 py-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          tags: prev.tags.filter((_, i) => i !== index),
                        }))
                      }
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    title: 'Test Page',
                    content: '<p>Start typing your content here...</p>',
                    pageType: 'INFO' as ContentType,
                    tags: ['test', 'editor'],
                  })
                }
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Test Save (Console)
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Content Preview
            </h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">
                {formData.title}
              </h3>
              <div
                className="prose max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Test Instructions
            </h2>
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">
                Rich Text Editor Features to Test:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • <strong>Text Formatting:</strong> Bold, Italic,
                  Strikethrough
                </li>
                <li>
                  • <strong>Headings:</strong> H1 through H6
                </li>
                <li>
                  • <strong>Lists:</strong> Bullet points and numbered lists
                </li>
                <li>
                  • <strong>Links:</strong> Click the link button to add
                  hyperlinks
                </li>
                <li>
                  • <strong>Images:</strong> Click the image button to add
                  images by URL
                </li>
                <li>
                  • <strong>YouTube:</strong> Click the video button to embed
                  YouTube videos
                </li>
                <li>
                  • <strong>Tables:</strong> Click the table button to insert
                  tables
                </li>
                <li>
                  • <strong>Quotes:</strong> Use the quote button for
                  blockquotes
                </li>
                <li>
                  • <strong>Horizontal Rule:</strong> Add divider lines
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
