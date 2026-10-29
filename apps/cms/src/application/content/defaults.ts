import type { SiteSettings } from '@gtmsoftware-core/cms-sdk';

export const defaultSiteSettings = (businessName: string): SiteSettings => ({
  businessName,
  logo: null,
  colors: { primary: '#0f766e', secondary: '#f59e0b' },
  contact: { phone: '', whatsapp: '', email: '' },
  address: { street: '', city: '', state: '', postalCode: '' },
  social: { instagram: '', facebook: '', linkedin: '', youtube: '', tiktok: '' },
  openingHours: [],
  footerNote: '',
});
