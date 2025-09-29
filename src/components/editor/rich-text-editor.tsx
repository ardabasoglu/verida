'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Youtube from '@tiptap/extension-youtube';
import { useCallback, useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
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
import { YouTubeEmbedModal } from './youtube-embed';
import { type YouTubeVideoInfo } from '@/lib/youtube-utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'İçeriğinizi yazın...',
  className = '',
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border w-full',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-border',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border bg-muted p-2 font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2',
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
        inline: false,
        allowFullscreen: true,
        width: 640,
        height: 480,
      }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Sanitize content before saving
      const sanitizedHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p',
          'br',
          'strong',
          'em',
          'u',
          's',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'ul',
          'ol',
          'li',
          'blockquote',
          'a',
          'img',
          'table',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
          'div',
          'span',
          'iframe',
        ],
        ALLOWED_ATTR: [
          'href',
          'src',
          'alt',
          'title',
          'class',
          'width',
          'height',
          'frameborder',
          'allowfullscreen',
          'allow',
        ],
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });
      onChange(sanitizedHtml);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt("Görsel URL'si girin:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleYouTubeEmbed = useCallback(
    (videoInfo: YouTubeVideoInfo) => {
      if (editor) {
        editor.commands.setYoutubeVideo({
          src: videoInfo.url,
          width: 640,
          height: 480,
        });
      }
    },
    [editor]
  );

  const openYouTubeModal = useCallback(() => {
    setIsYouTubeModalOpen(true);
  }, []);

  const openLinkModal = useCallback(() => {
    const { from, to } = editor?.state.selection || { from: 0, to: 0 };
    const selectedText = editor?.state.doc.textBetween(from, to, '');

    setLinkText(selectedText || '');
    setLinkUrl('');
    setIsLinkModalOpen(true);
  }, [editor]);

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      if (linkText) {
        // Insert new text with link
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${linkUrl}">${linkText}</a>`)
          .run();
      } else {
        // Add link to selected text
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
    }
    setIsLinkModalOpen(false);
    setLinkUrl('');
    setLinkText('');
  }, [editor, linkUrl, linkText]);

  const insertTable = useCallback(() => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    }
  }, [editor]);

  if (!editor) {
    return <div className="animate-pulse bg-border h-64 rounded-md"></div>;
  }

  // Don't render until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className={`border border-border rounded-md ${className}`}>
        <div className="min-h-[300px] p-4 text-muted-foreground">
          Editor yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-border rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-border p-2 flex flex-wrap gap-1 bg-muted">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-border pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-border ${
              editor.isActive('bold') ? 'bg-gray-300' : ''
            }`}
            title="Kalın"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-border ${
              editor.isActive('italic') ? 'bg-gray-300' : ''
            }`}
            title="İtalik"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-border ${
              editor.isActive('strike') ? 'bg-gray-300' : ''
            }`}
            title="Üstü Çizili"
          >
            <s>S</s>
          </button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-border pr-2 mr-2">
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
                  .run()
              }
              className={`p-2 rounded hover:bg-border text-sm ${
                editor.isActive('heading', { level }) ? 'bg-gray-300' : ''
              }`}
              title={`Başlık ${level}`}
            >
              H{level}
            </button>
          ))}
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-border pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-border ${
              editor.isActive('bulletList') ? 'bg-gray-300' : ''
            }`}
            title="Madde İşaretli Liste"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-border ${
              editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
            title="Numaralı Liste"
          >
            1.
          </button>
        </div>

        {/* Media & Links */}
        <div className="flex gap-1 border-r border-border pr-2 mr-2">
          <button
            type="button"
            onClick={openLinkModal}
            className="p-2 rounded hover:bg-border"
            title="Link Ekle"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={addImage}
            className="p-2 rounded hover:bg-border"
            title="Görsel Ekle"
          >
            🖼️
          </button>
          <button
            type="button"
            onClick={openYouTubeModal}
            className="p-2 rounded hover:bg-border"
            title="YouTube Video Ekle"
          >
            📹
          </button>
        </div>

        {/* Table */}
        <div className="flex gap-1 border-r border-border pr-2 mr-2">
          <button
            type="button"
            onClick={insertTable}
            className="p-2 rounded hover:bg-border"
            title="Tablo Ekle"
          >
            📊
          </button>
        </div>

        {/* Other */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-border ${
              editor.isActive('blockquote') ? 'bg-gray-300' : ''
            }`}
            title="Alıntı"
          >
            &quot;
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded hover:bg-border"
            title="Yatay Çizgi"
          >
            ―
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[300px]">
        <EditorContent
          editor={editor}
          className="prose max-w-none"
          placeholder={placeholder}
        />
      </div>

      {/* Link Modal */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Ekle</DialogTitle>
            <DialogDescription>Metne bir link ekleyin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Link Metni
              </label>
              <Input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link metni (opsiyonel)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                URL
              </label>
              <Input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={addLink} disabled={!linkUrl}>
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YouTube Embed Modal */}
      <YouTubeEmbedModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        onEmbed={handleYouTubeEmbed}
      />
    </div>
  );
}
