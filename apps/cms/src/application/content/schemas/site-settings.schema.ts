import { siteSettingsSchema } from '@gtmsoftware-core/cms-sdk';
import type { z } from 'zod';
import { siteRefSchema, versionSchema } from './content-ref.schema';

export { siteSettingsSchema };

export const saveSiteSettingsSchema = siteRefSchema.extend({ version: versionSchema, settings: siteSettingsSchema });

export type SaveSiteSettingsInput = z.input<typeof saveSiteSettingsSchema>;
