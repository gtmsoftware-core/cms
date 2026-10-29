'use client';

import { FormProvider } from 'react-hook-form';
import type { SaveSiteSettingsInput, SiteRef, SiteSettingsDetail } from '@/application/content';
import type { MediaSummary } from '@/application/media';
import { siteSettingsSchema } from '@/application/content/schemas/site-settings.schema';
import { FormStatus, useActionForm, type FormAction } from '@/presentation/forms';
import { MediaLibraryProvider } from '@/presentation/media';
import { Button } from '@/presentation/ui';
import { Section } from '@/presentation/shell';
import { ContactFields } from './contact-fields';
import { IdentityFields } from './identity-fields';
import { PresenceFields } from './presence-fields';

type SiteSettingsFormProps = {
  site: SiteRef;
  detail: SiteSettingsDetail;
  media: readonly MediaSummary[];
  action: FormAction<SaveSiteSettingsInput>;
};

export function SiteSettingsForm({ site, detail, media, action }: SiteSettingsFormProps) {
  const save = (settings: SaveSiteSettingsInput['settings']) => action({ ...site, version: detail.version, settings });
  const { form, state, pending, onSubmit } = useActionForm(siteSettingsSchema, save, detail.settings, { keepValues: true });

  return (
    <MediaLibraryProvider media={media}>
      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="grid gap-6" noValidate>
          <Section title="Identidade">
            <IdentityFields />
          </Section>
          <Section title="Contato e endereço">
            <ContactFields />
          </Section>
          <Section title="Redes e horários">
            <PresenceFields />
          </Section>
          <div className="bg-background/95 sticky bottom-0 grid gap-3 border-t py-4">
            <FormStatus state={state} />
            <Button type="submit" disabled={pending} className="justify-self-start">
              Salvar e atualizar o site
            </Button>
          </div>
        </form>
      </FormProvider>
    </MediaLibraryProvider>
  );
}
