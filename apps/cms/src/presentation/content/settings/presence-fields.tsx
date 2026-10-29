'use client';

import type { SiteSettings } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { ItemList } from '../fields/item-list';

const SOCIAL = [
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['linkedin', 'LinkedIn'],
  ['youtube', 'YouTube'],
  ['tiktok', 'TikTok'],
] as const;

const newOpeningHours = () => ({ days: '', hours: '' });

export function PresenceFields() {
  return (
    <div className="grid gap-6">
      <fieldset className="grid gap-4">
        <legend className="mb-2 text-sm font-medium">Redes sociais (opcional)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL.map(([key, label]) => (
            <FormTextField<SiteSettings> key={key} name={`social.${key}`} label={label} type="url" placeholder="https://..." />
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="mb-2 text-sm font-medium">Horário de funcionamento</legend>
        <ItemList<SiteSettings, 'openingHours'> name="openingHours" itemLabel="Horário" addLabel="Adicionar horário" newItem={newOpeningHours}>
          {(item) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormTextField<SiteSettings> name={`openingHours.${item}.days`} label="Dias" placeholder="Seg a sex" />
              <FormTextField<SiteSettings> name={`openingHours.${item}.hours`} label="Horário" placeholder="8h às 18h" />
            </div>
          )}
        </ItemList>
      </fieldset>
    </div>
  );
}
