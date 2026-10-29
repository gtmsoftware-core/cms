'use client';

import type { SiteSettings } from '@/application/content';
import { FormTextField } from '@/presentation/forms';

export function ContactFields() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormTextField<SiteSettings> name="contact.phone" label="Telefone" type="tel" placeholder="(11) 3333-4444" />
        <FormTextField<SiteSettings> name="contact.whatsapp" label="WhatsApp" type="tel" placeholder="(11) 99999-8888" />
        <FormTextField<SiteSettings> name="contact.email" label="E-mail" type="email" />
      </div>
      <FormTextField<SiteSettings> name="address.street" label="Endereço" placeholder="Rua, número, bairro" />
      <div className="grid gap-4 sm:grid-cols-3">
        <FormTextField<SiteSettings> name="address.city" label="Cidade" />
        <FormTextField<SiteSettings> name="address.state" label="Estado" placeholder="SP" />
        <FormTextField<SiteSettings> name="address.postalCode" label="CEP" />
      </div>
    </div>
  );
}
