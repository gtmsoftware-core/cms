import type { SiteScope } from '@/domain/sites';
import type { Media, MediaId } from './entities';

export interface MediaRepository {
  findById(scope: SiteScope, id: MediaId): Promise<Media | null>;
  list(scope: SiteScope): Promise<Media[]>;
  save(scope: SiteScope, media: Media): Promise<void>;
  delete(scope: SiteScope, id: MediaId): Promise<void>;
}
