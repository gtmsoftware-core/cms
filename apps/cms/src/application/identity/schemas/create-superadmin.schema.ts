import { z } from 'zod';
import { emailField, nameField, passwordField } from './credentials';

export const createSuperadminSchema = z.object({
  email: emailField,
  name: nameField,
  password: passwordField,
});

export type CreateSuperadminInput = z.input<typeof createSuperadminSchema>;
