import { describe, expect, it } from 'vitest';
import { CMS_TAGS, tagsFor } from './tags';

describe('CMS_TAGS', () => {
  it('generates site-wide tags without siteId', () => {
    expect(CMS_TAGS.site()).toBe('cms:site');
    expect(CMS_TAGS.settings()).toBe('cms:settings');
    expect(CMS_TAGS.pageList()).toBe('cms:page:list');
  });

  it('generates per-resource tags', () => {
    expect(CMS_TAGS.page('servicos')).toBe('cms:page:servicos');
    expect(CMS_TAGS.collection('faq')).toBe('cms:collection:faq');
  });
});

describe('tagsFor', () => {
  it('always includes the site-wide tag', () => {
    expect(tagsFor({ type: 'settings' })).toEqual(['cms:site', 'cms:settings']);
    expect(tagsFor()).toEqual(['cms:site']);
  });

  it('merges several resources without duplicates', () => {
    const tags = tagsFor({ type: 'page', slug: 'servicos' }, { type: 'page-list' }, { type: 'page', slug: 'servicos' });
    expect(tags).toEqual(['cms:site', 'cms:page:servicos', 'cms:page:list']);
  });
});
