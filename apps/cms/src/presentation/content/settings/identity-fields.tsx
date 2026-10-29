'use client';

import type { SiteSettings } from '@/application/content';
import { FormTextField } from '@/presentation/forms';
import { ImageField } from '../fields/media-fields';

export function IdentityFields() {
  return (
    <div className="grid gap-4">
      <FormTextField<SiteSettings> name="businessName" label="Nome do negócio" />
      <ImageField<SiteSettings> name="logo" legend="Logo" />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextField<SiteSettings> name="colors.primary" label="Cor principal" type="color" />
        <FormTextField<SiteSettings> name="colors.secondary" label="Cor de destaque" type="color" />
      </div>
      <FormTextField<SiteSettings>
        name="footerNote"
        label="Texto do rodapé"
        hint="Opcional. Ex.: Suplementos & Naturais · Natuba-PB · CNPJ 00.000.000/0001-00"
      />
    </div>
  );
}
