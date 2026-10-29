import { notFound } from 'next/navigation';
import type { ActionState } from '@/shared/action-state';

/** Domain and application errors, matched by their stable `name`, turned into UI messages. */
const MESSAGES: Readonly<Record<string, string>> = {
  ForbiddenError: 'Você não tem permissão para fazer isso.',
  TenantNotFoundError: 'Cliente não encontrado.',
  SiteNotFoundError: 'Site não encontrado.',
  ContentNotFoundError: 'Conteúdo não encontrado. Ele pode ter sido excluído.',
  SlugAlreadyInUseError: 'Já existe uma página com esse endereço.',
  ContentConflictError: 'Outra pessoa salvou este conteúdo enquanto você editava. Recarregue a página para ver a versão mais recente.',
  TenantSlugAlreadyInUseError: 'Já existe um cliente com esse identificador.',
  InvalidSlugError: 'Identificador inválido.',
  EmailAlreadyInUseError: 'Já existe uma conta com esse e-mail.',
  PasswordRequiredError: 'Essa pessoa ainda não tem conta. Informe uma senha inicial.',
  InvalidCredentialsError: 'E-mail ou senha incorretos.',
  TooManyAttemptsError: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  WebhookNotConfiguredError: 'Configure o endereço e gere o segredo do webhook antes de testar.',
  MediaNotFoundError: 'Imagem não encontrada. Ela pode ter sido excluída.',
  UnsupportedMediaTypeError: 'Formato não aceito. Envie JPG, PNG, WebP, GIF, AVIF ou SVG.',
  UnsafeSvgError: 'Este SVG tem scripts ou links externos e não pode ser usado. Exporte o arquivo de novo como imagem simples ou envie em PNG.',
  MediaTooLargeError: 'Imagem grande demais. O limite é 4 MB.',
  MediaStorageError: 'Não foi possível salvar a imagem no armazenamento. Tente de novo em instantes; se continuar, avise o suporte.',
  ZodError: 'Confira os campos do formulário.',
};

const NOT_FOUND = new Set(['ForbiddenError', 'TenantNotFoundError', 'SiteNotFoundError', 'ContentNotFoundError', 'MediaNotFoundError']);

export function toErrorState(error: unknown): ActionState {
  const message = error instanceof Error ? MESSAGES[error.name] : undefined;
  if (!message) throw error;
  return { status: 'error', message };
}

/** Runs a mutation and converts known errors into an error state. Unknown errors keep propagating. */
export async function runAction(mutation: () => Promise<string | undefined>): Promise<ActionState> {
  try {
    const message = await mutation();
    return message ? { status: 'success', message } : { status: 'success' };
  } catch (error) {
    return toErrorState(error);
  }
}

/** For pages: access errors render the 404 page, so foreign tenants and sites stay invisible. */
export async function orNotFound<T>(query: Promise<T>): Promise<T> {
  try {
    return await query;
  } catch (error) {
    if (error instanceof Error && NOT_FOUND.has(error.name)) notFound();
    throw error;
  }
}
