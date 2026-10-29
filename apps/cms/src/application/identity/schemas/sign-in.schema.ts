import { z } from 'zod';
import { emailField } from './credentials';

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe a senha.'),
});

export type SignInInput = z.input<typeof signInSchema>;
