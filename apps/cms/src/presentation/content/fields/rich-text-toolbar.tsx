'use client';

import { useEditorState, type Editor } from '@tiptap/react';
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button, Input, cn } from '@/presentation/ui';

type ToolProps = { label: string; active: boolean; onClick: () => void; children: ReactNode };

function Tool({ label, active, onClick, children }: ToolProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      className={cn(active && 'bg-accent')}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function RichTextToolbar({ editor }: { editor: Editor }) {
  const [linkDraft, setLinkDraft] = useState<string | null>(null);
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
    }),
  });
  const chain = () => editor.chain().focus();

  function applyLink() {
    const href = linkDraft?.trim() ?? '';
    if (href === '') chain().extendMarkRange('link').unsetLink().run();
    else chain().extendMarkRange('link').setLink({ href }).run();
    setLinkDraft(null);
  }

  return (
    <div className="grid gap-2 border-b p-1">
      <div className="flex flex-wrap gap-1">
        <Tool label="Negrito" active={active.bold} onClick={() => chain().toggleBold().run()}><Bold /></Tool>
        <Tool label="Itálico" active={active.italic} onClick={() => chain().toggleItalic().run()}><Italic /></Tool>
        <Tool label="Subtítulo" active={active.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}><Heading2 /></Tool>
        <Tool label="Subtítulo menor" active={active.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}><Heading3 /></Tool>
        <Tool label="Lista" active={active.bullet} onClick={() => chain().toggleBulletList().run()}><List /></Tool>
        <Tool label="Lista numerada" active={active.ordered} onClick={() => chain().toggleOrderedList().run()}><ListOrdered /></Tool>
        <Tool label="Citação" active={active.quote} onClick={() => chain().toggleBlockquote().run()}><Quote /></Tool>
        <Tool label="Link" active={active.link} onClick={() => setLinkDraft(editor.getAttributes('link')['href'] ?? '')}><Link2 /></Tool>
      </div>
      {linkDraft !== null && (
        <div className="flex gap-2">
          <Input
            aria-label="Endereço do link"
            placeholder="https://... (vazio remove o link)"
            value={linkDraft}
            autoFocus
            onChange={(event) => setLinkDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyLink();
              }
            }}
          />
          <Button type="button" size="sm" onClick={applyLink}>Aplicar</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setLinkDraft(null)}>Cancelar</Button>
        </div>
      )}
    </div>
  );
}
