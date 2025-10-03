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
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-6 leading-relaxed',
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
    return (
      <div className={`rounded-lg border-2 border-border/50 bg-muted/20 ${className}`}>
        <div className="animate-pulse h-80 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 bg-muted-foreground/20 rounded-full mx-auto animate-bounce"></div>
            <p className="text-sm font-medium text-muted-foreground">Editor hazırlanıyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className={`rounded-lg border-2 border-border/50 bg-muted/20 ${className}`}>
        <div className="min-h-[320px] p-6 text-muted-foreground flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-pulse w-8 h-8 bg-muted-foreground/20 rounded-full mx-auto"></div>
            <p className="text-sm font-medium">Editor yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-0 overflow-hidden bg-background shadow-sm ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-border/50 p-4 flex flex-wrap gap-2 bg-muted/30 backdrop-blur-sm">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-border/30 pr-3 mr-3">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm ${
              editor.isActive('bold') 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Kalın"
          >
            <strong className="text-sm font-bold">B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm ${
              editor.isActive('italic') 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="İtalik"
          >
            <em className="text-sm font-medium">I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm ${
              editor.isActive('strike') 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Üstü Çizili"
          >
            <s className="text-sm font-medium">S</s>
          </button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-border/30 pr-3 mr-3">
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
              className={`p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm text-xs font-semibold ${
                editor.isActive('heading', { level }) 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={`Başlık ${level}`}
            >
              H{level}
            </button>
          ))}
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-border/30 pr-3 mr-3">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm ${
              editor.isActive('bulletList') 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Madde İşaretli Liste"
          >
            <span className="text-sm font-bold">•</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm ${
              editor.isActive('orderedList') 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Numaralı Liste"
          >
            <span className="text-xs font-semibold">1.</span>
          </button>
        </div>

        {/* Media & Links */}
        <div className="flex gap-1 border-r border-border/30 pr-3 mr-3">
          <button
            type="button"
            onClick={openLinkModal}
            className="p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm text-muted-foreground hover:text-foreground"
            title="Link Ekle"
          >
            <span className="text-sm">🔗</span>
          </button>
          <button
            type="button"
            onClick={addImage}
            className="p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm text-muted-foreground hover:text-foreground"
            title="Görsel Ekle"
          >
            <span className="text-sm">🖼️</span>
          </button>
          <button
            type="button"
            onClick={openYouTubeModal}
            className="p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm text-muted-foreground hover:text-foreground"
            title="YouTube Video Ekle"
          >
            <span className="text-sm">📹</span>
          </button>
        </div>

        {/* Table */}
        <div className="flex gap-1 border-r border-border/30 pr-3 mr-3">
          <button
            type="button"
            onClick={insertTable}
            className="p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm text-muted-foreground hover:text-foreground"
            title="Tablo Ekle"
          >
            <span className="text-sm">📊</span>
          </button>
        </div>

        {/* Other */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm ${
              editor.isActive('blockquote') 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Alıntı"
          >
            <span className="text-sm font-bold">&quot;</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2.5 rounded-md transition-all duration-200 hover:bg-background hover:shadow-sm text-muted-foreground hover:text-foreground"
            title="Yatay Çizgi"
          >
            <span className="text-sm font-bold">―</span>
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[320px] bg-background">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none focus:outline-none"
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
