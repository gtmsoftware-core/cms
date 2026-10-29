import { z } from 'zod';
import { emailField, nameField, passwordField } from './credentials';

export const addMemberSchema = z.object({
  tenantId: z.string().min(1),
  email: emailField,
  name: nameField,
  role: z.enum(['owner', 'editor']),
  /** Only used when the e-mail has no account yet. */
  password: z.union([z.literal(''), passwordField]),
});

export type AddMemberInput = z.input<typeof addMemberSchema>;
