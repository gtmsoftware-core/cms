'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { FormStatus } from '@/presentation/forms';
import { Button, Input, Label } from '@/presentation/ui';
import { idleState, type ActionState } from '@/shared/action-state';
import { MAX_UPLOAD_BYTES } from './format';

type MediaUploadFormProps = { action: (formData: FormData) => Promise<ActionState> };

export function MediaUploadForm({ action }: MediaUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<ActionState>(idleState);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get('file');
    if (file instanceof File && file.size > MAX_UPLOAD_BYTES) {
      setState({ status: 'error', message: 'Imagem grande demais. O limite é 4 MB.' });
      return;
    }
    startTransition(async () => {
      const result = await action(formData);
      setState(result);
      if (result.status === 'success') formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="media-file">Imagem</Label>
        <Input id="media-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,.svg" required />
        <p className="text-muted-foreground text-sm">JPG, PNG, WebP, GIF, AVIF ou SVG, até 4 MB.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="media-alt">Descrição da imagem</Label>
        <Input id="media-alt" name="alt" maxLength={200} placeholder="Ex.: Recepção da clínica" />
        <p className="text-muted-foreground text-sm">Ajuda pessoas com deficiência visual e o Google.</p>
      </div>
      <FormStatus state={state} />
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? 'Enviando…' : 'Enviar imagem'}
      </Button>
    </form>
  );
}
