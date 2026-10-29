import type { UnitOfWork } from '@/application/content';
import { createDrizzleContentRepository } from '@/infrastructure/content';
import type { Database } from '@/infrastructure/db';
import { createDrizzleMediaRepository } from '@/infrastructure/media';
import { createDrizzleOutboxRepository } from './drizzle-outbox-repository';

/** Content and media changes and their outbox events commit or roll back together. */
export function createDrizzleUnitOfWork(db: Database): UnitOfWork {
  return {
    transaction: (work) =>
      db.transaction((tx) =>
        work({
          contents: createDrizzleContentRepository(tx),
          media: createDrizzleMediaRepository(tx),
          outbox: createDrizzleOutboxRepository(tx),
        }),
      ),
  };
}
