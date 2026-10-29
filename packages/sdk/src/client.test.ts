import { describe, expect, it } from 'vitest';
import { CmsApiError, createCmsClient, type CmsFetch } from './client';

const page = {
  title: 'Serviços',
  slug: 'servicos',
  seo: { title: '', description: '', image: null },
  blocks: [],
};

function fakeFetch(status: number, body: unknown) {
  const calls: { url: string; init: Parameters<CmsFetch>[1] }[] = [];
  const fetch: CmsFetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  };
  return { fetch, calls };
}

const options = { baseUrl: 'https://cms.example.com/', siteId: 'site_1', apiKey: 'cms_live_x' };

describe('createCmsClient', () => {
  it('reads a page with the API key and the cache tags', async () => {
    const { fetch, calls } = fakeFetch(200, { page, updatedAt: '2026-10-28T14:00:00.000Z' });
    const client = createCmsClient({ ...options, fetch });

    expect(await client.getPage('servicos')).toEqual(page);
    expect(calls[0]?.url).toBe('https://cms.example.com/api/v1/sites/site_1/pages/servicos');
    expect(calls[0]?.init.headers).toMatchObject({ authorization: 'Bearer cms_live_x' });
    expect(calls[0]?.init.next?.tags).toEqual(['cms:site', 'cms:page:servicos']);
  });

  it('returns null for missing content', async () => {
    const { fetch } = fakeFetch(404, { error: 'not_found' });
    const client = createCmsClient({ ...options, fetch });
    expect(await client.getPage('nao-existe')).toBeNull();
    expect(await client.getSettings()).toBeNull();
    expect(await client.listPages()).toEqual([]);
  });

  it('throws on other errors and on responses outside the contract', async () => {
    await expect(createCmsClient({ ...options, fetch: fakeFetch(401, { error: 'unauthorized' }).fetch }).listPages()).rejects.toThrow(
      CmsApiError,
    );
    await expect(createCmsClient({ ...options, fetch: fakeFetch(200, { pages: [{ slug: 1 }] }).fetch }).listPages()).rejects.toThrow();
  });
});
