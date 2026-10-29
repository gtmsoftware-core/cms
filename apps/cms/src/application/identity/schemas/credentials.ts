import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 10;

export const emailField = z.email('Informe um e-mail válido.').trim().toLowerCase();
export const nameField = z.string().trim().min(2, 'Informe o nome.').max(100, 'Use no máximo 100 caracteres.');
export const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha precisa de pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .max(128, 'Use no máximo 128 caracteres.');
