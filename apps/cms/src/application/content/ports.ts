import type { ContentRepository } from '@/domain/content';
import type { MediaRepository } from '@/domain/media';
import type { OutboxRepository } from '@/domain/webhooks';

export type TransactionalRepositories = Readonly<{
  contents: ContentRepository;
  media: MediaRepository;
  outbox: OutboxRepository;
}>;

/** Runs a change and its outbox events in one transaction: never a change without event, nor the reverse. */
export interface UnitOfWork {
  transaction<T>(work: (repositories: TransactionalRepositories) => Promise<T>): Promise<T>;
}
