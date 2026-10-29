import { z } from 'zod';

/**
 * Rich text is stored as Tiptap/ProseMirror JSON, never as HTML.
 * Only the nodes and marks below are accepted, so sites can render them with a fixed component map.
 */
export const RICH_TEXT_NODES = [
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'hardBreak',
] as const;

export const RICH_TEXT_MARKS = ['bold', 'italic', 'link'] as const;

/** Links accepted inside content: http(s), mailto, tel, relative paths and anchors. */
export const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

const attrValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const attrs = z.record(z.string(), attrValue);

const markSchema = z
  .object({ type: z.enum(RICH_TEXT_MARKS), attrs: attrs.optional() })
  .refine((mark) => mark.type !== 'link' || SAFE_HREF.test(String(mark.attrs?.['href'] ?? '')), {
    message: 'Link inválido. Use um endereço que comece com https://, mailto: ou tel:.',
  });

export type RichTextMark = z.infer<typeof markSchema>;

export type RichTextNode = {
  type: (typeof RICH_TEXT_NODES)[number];
  attrs?: Record<string, string | number | boolean | null>;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
};

export const richTextNodeSchema: z.ZodType<RichTextNode> = z.lazy(() =>
  z.object({
    type: z.enum(RICH_TEXT_NODES),
    attrs: attrs.optional(),
    content: z.array(richTextNodeSchema).optional(),
    marks: z.array(markSchema).optional(),
    text: z.string().optional(),
  }),
);

export const richTextSchema = z.object({
  type: z.literal('doc'),
  content: z.array(richTextNodeSchema),
});

export type RichText = z.infer<typeof richTextSchema>;

export const emptyRichText = (): RichText => ({ type: 'doc', content: [{ type: 'paragraph' }] });
