import { z } from 'zod';

export const issueApiKeySchema = z.object({ tenantId: z.string().min(1), siteId: z.string().min(1) });

export type IssueApiKeyInput = z.input<typeof issueApiKeySchema>;
