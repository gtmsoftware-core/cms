import path from 'node:path';
import {
  makeChangePageStatus,
  makeCreatePage,
  makeDeletePage,
  makeGetPage,
  makeGetSiteSettings,
  makeListPages,
  makeSavePage,
  makeSaveSiteSettings,
} from '@/application/content';
import {
  makeAuthenticateSite,
  makeGetPublishedPage,
  makeGetPublishedSettings,
  makeListPublishedPages,
} from '@/application/delivery';
import {
  makeAddMember,
  makeCreateSuperadmin,
  makeGetCurrentActor,
  makeListMembers,
  makeSignIn,
} from '@/application/identity';
import { makeDeleteMedia, makeListMedia, makeUploadMedia, type MediaStorage } from '@/application/media';
import { makeCreateSite, makeGetSite, makeIssueApiKey, makeListSites } from '@/application/sites';
import {
  makeDispatchDue,
  makeGetWebhookOverview,
  makeRetryFailed,
  makeRevalidateSite,
  makeRotateWebhookSecret,
  makeSetWebhookUrl,
  makeTestConnection,
  type WebhookSender,
} from '@/application/webhooks';
import { makeCreateTenant, makeGetTenantBySlug, makeListTenants } from '@/application/tenants';
import { createDrizzleContentRepository } from '@/infrastructure/content';
import {
  createDrizzleMediaRepository,
  createLocalMediaStorage,
  createR2MediaStorage,
  type R2Config,
} from '@/infrastructure/media';
import { createPgliteDatabase, createPostgresDatabase, type Database } from '@/infrastructure/db';
import {
  createAuth,
  createBetterAuthAuthenticator,
  createBetterAuthUserAccounts,
  createDrizzleMembershipRepository,
  createDrizzleUserRepository,
} from '@/infrastructure/identity';
import { createInMemoryRateLimiter } from '@/infrastructure/rate-limit';
import { createSha256ApiKeys } from '@/infrastructure/security';
import { createDrizzleSiteRepository } from '@/infrastructure/sites';
import { createDrizzleTenantRepository } from '@/infrastructure/tenants';
import {
  createAesGcmWebhookSecrets,
  createDrizzleOutboxRepository,
  createDrizzleUnitOfWork,
  createDrizzleWebhookDeliveryRepository,
  createFetchWebhookSender,
} from '@/infrastructure/webhooks';
import { systemClock, type Clock } from '@/shared/clock';
import { loadEnv, type Env } from './env';

export type ContainerConfig = Readonly<{
  authSecret: string;
  baseURL: string;
  webhookEncryptionKey: Buffer;
  cronSecret: string;
  media: MediaConfig;
}>;

export type MediaConfig = Readonly<{ kind: 'local'; dir: string }> | (Readonly<{ kind: 'r2' }> & R2Config);

function createMediaStorage(config: MediaConfig, baseUrl: string): MediaStorage {
  return config.kind === 'local' ? createLocalMediaStorage({ dir: config.dir, baseUrl }) : createR2MediaStorage(config);
}

/** Replaceable adapters, for tests that must not reach the network. */
export type ContainerOverrides = Readonly<{ webhookSender?: WebhookSender; clock?: Clock }>;

export function buildContainer(db: Database, config: ContainerConfig, overrides: ContainerOverrides = {}) {
  const clock = overrides.clock ?? systemClock;
  const tenants = createDrizzleTenantRepository(db);
  const sites = createDrizzleSiteRepository(db);
  const users = createDrizzleUserRepository(db);
  const memberships = createDrizzleMembershipRepository(db);
  const contents = createDrizzleContentRepository(db);
  const media = createDrizzleMediaRepository(db);
  const storage = createMediaStorage(config.media, config.baseURL);
  const outbox = createDrizzleOutboxRepository(db);
  const deliveries = createDrizzleWebhookDeliveryRepository(db);
  const uow = createDrizzleUnitOfWork(db);
  const secrets = createAesGcmWebhookSecrets(config.webhookEncryptionKey);
  const sender = overrides.webhookSender ?? createFetchWebhookSender(clock);
  const betterAuth = createAuth({ db, secret: config.authSecret, baseURL: config.baseURL });
  const accounts = createBetterAuthUserAccounts(betterAuth);
  const authenticator = createBetterAuthAuthenticator(betterAuth);
  const rateLimiter = createInMemoryRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000, clock });
  const deliveryRateLimiter = createInMemoryRateLimiter({ limit: 600, windowMs: 60 * 1000, clock });
  const apiKeys = createSha256ApiKeys();

  return {
    /** Public address of this CMS, shown in the environment block of a new site. */
    publicUrl: config.baseURL,
    cronSecret: config.cronSecret,
    signIn: makeSignIn({ authenticator, rateLimiter }),
    signOut: () => authenticator.signOut(),
    getCurrentActor: makeGetCurrentActor({ authenticator, users, memberships }),
    createSuperadmin: makeCreateSuperadmin({ users, accounts }),
    addMember: makeAddMember({ tenants, users, memberships, accounts }),
    listMembers: makeListMembers({ users, memberships }),
    createTenant: makeCreateTenant({ tenants, clock }),
    listTenants: makeListTenants({ tenants }),
    getTenantBySlug: makeGetTenantBySlug({ tenants }),
    createSite: makeCreateSite({ sites, tenants, clock }),
    listSites: makeListSites({ sites }),
    getSite: makeGetSite({ sites }),
    issueApiKey: makeIssueApiKey({ sites, apiKeys }),
    authenticateSite: makeAuthenticateSite({ sites, apiKeys, rateLimiter: deliveryRateLimiter }),
    listPublishedPages: makeListPublishedPages({ contents }),
    getPublishedPage: makeGetPublishedPage({ contents }),
    getPublishedSettings: makeGetPublishedSettings({ contents }),
    listPages: makeListPages({ sites, contents }),
    createPage: makeCreatePage({ sites, uow, clock }),
    getPage: makeGetPage({ sites, contents }),
    savePage: makeSavePage({ sites, uow, clock }),
    changePageStatus: makeChangePageStatus({ sites, uow, clock }),
    deletePage: makeDeletePage({ sites, uow, clock }),
    getSiteSettings: makeGetSiteSettings({ sites, contents }),
    saveSiteSettings: makeSaveSiteSettings({ sites, uow, clock }),
    setWebhookUrl: makeSetWebhookUrl({ sites }),
    rotateWebhookSecret: makeRotateWebhookSecret({ sites, secrets }),
    testConnection: makeTestConnection({ sites, deliveries, secrets, sender, clock }),
    getWebhookOverview: makeGetWebhookOverview({ sites, outbox, deliveries }),
    retryFailed: makeRetryFailed({ sites, outbox, clock }),
    revalidateSite: makeRevalidateSite({ sites, outbox, clock }),
    dispatchDue: makeDispatchDue({ outbox, deliveries, sites, secrets, sender, clock }),
    listMedia: makeListMedia({ sites, media, storage }),
    uploadMedia: makeUploadMedia({ sites, media, storage, clock }),
    deleteMedia: makeDeleteMedia({ sites, storage, uow, clock }),
    /** Files of the local storage, served by /media/[...key]. Null when media lives in R2. */
    readLocalMedia: storage.read ? (key: string) => storage.read?.(key) ?? Promise.resolve(null) : null,
  };
}

export type Container = ReturnType<typeof buildContainer>;

async function createContainer(): Promise<Container> {
  const env = loadEnv();
  const db = await databaseFrom(env);
  return buildContainer(db, {
    authSecret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    webhookEncryptionKey: Buffer.from(env.WEBHOOK_ENCRYPTION_KEY, 'base64'),
    cronSecret: env.CRON_SECRET,
    media: mediaConfigFrom(env),
  });
}

function databaseFrom(env: Env): Promise<Database> {
  if (env.DATABASE_URL) return Promise.resolve(createPostgresDatabase(env.DATABASE_URL));
  return createPgliteDatabase({ dataDir: path.resolve(env.PGLITE_DATA_DIR), migrationsFolder: path.resolve('drizzle') });
}

function mediaConfigFrom(env: Env): MediaConfig {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = env;
  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_URL) {
    return {
      kind: 'r2',
      accountId: R2_ACCOUNT_ID,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET,
      publicUrl: R2_PUBLIC_URL,
    };
  }
  return { kind: 'local', dir: path.resolve(env.MEDIA_LOCAL_DIR) };
}

// One container per process: PGlite allows a single open instance per data directory,
// and Postgres keeps one connection pool. Cached on globalThis to survive hot reloads.
const cache = globalThis as typeof globalThis & { __cmsContainer?: Promise<Container> };

export function getContainer(): Promise<Container> {
  cache.__cmsContainer ??= createContainer();
  return cache.__cmsContainer;
}
