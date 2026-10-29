'use client';

import { FormProvider } from 'react-hook-form';
import type { ContentRef, PageDetail, SavePageInput } from '@/application/content';
import type { MediaSummary } from '@/application/media';
import { pageSchema } from '@/application/content/schemas/page.schema';
import { FormStatus, useActionForm, type FormAction } from '@/presentation/forms';
import { MediaLibraryProvider } from '@/presentation/media';
import { Button } from '@/presentation/ui';
import { BlockList } from '../blocks/block-list';
import { StatusBadge } from '../status-badge';
import { PageFields } from './page-fields';
import { PageStatusActions, type PageStatusActionsProps } from './page-status-actions';

type PageEditorProps = Pick<PageStatusActionsProps, 'statusAction' | 'deleteAction'> & {
  target: ContentRef;
  detail: PageDetail;
  media: readonly MediaSummary[];
  saveAction: FormAction<SavePageInput>;
};

export function PageEditor({ target, detail, media, saveAction, statusAction, deleteAction }: PageEditorProps) {
  const versioned = { ...target, version: detail.version };
  const save = (page: SavePageInput['page']) => saveAction({ ...versioned, page });
  const { form, state, pending, onSubmit } = useActionForm(pageSchema, save, detail.page, { keepValues: true });
  const live = detail.status === 'published';

  return (
    <MediaLibraryProvider media={media}>
      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="grid gap-6" noValidate>
          <div className="flex items-center gap-3">
            <StatusBadge status={detail.status} />
            {live && <span className="text-muted-foreground text-sm">Ao salvar, as alterações aparecem no site.</span>}
          </div>
          <PageFields />
          <BlockList />
          <div className="bg-background/95 sticky bottom-0 grid gap-3 border-t py-4">
            <FormStatus state={state} />
            <Button type="submit" disabled={pending} className="justify-self-start">
              {live ? 'Salvar e atualizar o site' : 'Salvar rascunho'}
            </Button>
          </div>
        </form>
        <PageStatusActions
          target={versioned}
          status={detail.status}
          hasUnsavedChanges={form.formState.isDirty}
          statusAction={statusAction}
          deleteAction={deleteAction}
        />
      </FormProvider>
    </MediaLibraryProvider>
  );
}
