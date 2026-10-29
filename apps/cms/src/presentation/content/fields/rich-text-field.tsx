'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useController, useFormContext, type FieldValues, type Path } from 'react-hook-form';
import { emptyRichText, richTextSchema } from '@/application/content/schemas/page.schema';
import { errorAt, hasErrorAt } from '@/presentation/forms';
import { Label } from '@/presentation/ui';
import { RichTextToolbar } from './rich-text-toolbar';

/** Only what the SDK rich-text schema accepts: no code, strike, underline or rules. */
const extensions = [
  StarterKit.configure({
    code: false,
    codeBlock: false,
    strike: false,
    underline: false,
    horizontalRule: false,
    heading: { levels: [2, 3] },
    link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
  }),
];

type RichTextFieldProps<T extends FieldValues> = { name: Path<T>; label: string };

export function RichTextField<T extends FieldValues>({ name, label }: RichTextFieldProps<T>) {
  const { control, formState } = useFormContext<T>();
  const { field } = useController({ control, name });
  const error =
    errorAt(formState.errors, name) ??
    (hasErrorAt(formState.errors, name) ? 'Confira o texto: links precisam começar com https://, mailto: ou tel:.' : undefined);

  const editor = useEditor({
    extensions,
    content: richTextSchema.safeParse(field.value).data ?? emptyRichText(),
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'rich-text min-h-32 px-3 py-2 outline-none', 'aria-label': label },
    },
    onUpdate: ({ editor: e }) => field.onChange(e.getJSON()),
    onBlur: () => field.onBlur(),
  });

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="rounded-md border shadow-xs" aria-invalid={Boolean(error)}>
        {editor && <RichTextToolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
