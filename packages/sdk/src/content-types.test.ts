import { describe, expect, it } from 'vitest';
import { imageSchema, pageSchema, siteSettingsSchema } from './content-types';
import { richTextSchema } from './rich-text';

const validPage = {
  title: 'Serviços',
  slug: 'servicos',
  seo: { title: '', description: '', image: null },
  blocks: [
    { id: 'b1', type: 'hero', heading: 'Bem-vindo', subheading: '', image: null, button: { label: 'Agende', href: 'https://wa.me/5511999999999' } },
    { id: 'b2', type: 'faq', heading: '', items: [{ question: 'Atende sábado?', answer: 'Sim.' }] },
    {
      id: 'b3',
      type: 'rich-text',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Olá' }] }] },
    },
  ],
};

describe('pageSchema', () => {
  it('accepts a valid page and is idempotent', () => {
    const parsed = pageSchema.parse(validPage);
    expect(pageSchema.parse(parsed)).toEqual(parsed);
  });

  it('rejects unknown block types and invalid slugs', () => {
    expect(pageSchema.safeParse({ ...validPage, blocks: [{ id: 'x', type: 'video' }] }).success).toBe(false);
    expect(pageSchema.safeParse({ ...validPage, slug: 'Serviços' }).success).toBe(false);
  });

  it('rejects list blocks without items', () => {
    const page = { ...validPage, blocks: [{ id: 'b', type: 'faq', heading: '', items: [] }] };
    expect(pageSchema.safeParse(page).success).toBe(false);
  });

  it('rejects unsafe button links', () => {
    const hero = { ...validPage.blocks[0], button: { label: 'x', href: 'javascript:alert(1)' } };
    expect(pageSchema.safeParse({ ...validPage, blocks: [hero] }).success).toBe(false);
  });
});

describe('richTextSchema', () => {
  const withLink = (href: string) => ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href } }] }] }],
  });

  it('accepts safe links and rejects javascript: links', () => {
    expect(richTextSchema.safeParse(withLink('https://exemplo.com')).success).toBe(true);
    expect(richTextSchema.safeParse(withLink('javascript:alert(1)')).success).toBe(false);
  });

  it('rejects nodes outside the allowlist', () => {
    const doc = { type: 'doc', content: [{ type: 'codeBlock', content: [] }] };
    expect(richTextSchema.safeParse(doc).success).toBe(false);
  });
});

describe('siteSettingsSchema', () => {
  const settings = {
    businessName: 'Clínica Sorriso',
    logo: null,
    colors: { primary: '#0f766e', secondary: '#f59e0b' },
    contact: { phone: '', whatsapp: '', email: '' },
    address: { street: '', city: '', state: '', postalCode: '' },
    social: { instagram: '', facebook: '', linkedin: '', youtube: '', tiktok: '' },
    openingHours: [{ days: 'Seg a sex', hours: '8h às 18h' }],
  };

  it('accepts empty optional fields', () => {
    expect(siteSettingsSchema.safeParse(settings).success).toBe(true);
  });

  it('rejects invalid colors and e-mails', () => {
    expect(siteSettingsSchema.safeParse({ ...settings, colors: { primary: 'red', secondary: '#000000' } }).success).toBe(false);
    expect(siteSettingsSchema.safeParse({ ...settings, contact: { ...settings.contact, email: 'x' } }).success).toBe(false);
  });
});

describe('imageSchema', () => {
  it('accepts HTTPS and local development addresses only', () => {
    const ok = (url: string) => imageSchema.safeParse({ url, alt: '' }).success;
    expect(ok('https://cdn.exemplo.com/a.jpg')).toBe(true);
    expect(ok('http://localhost:3000/media/a.jpg')).toBe(true);
    expect(ok('http://exemplo.com/a.jpg')).toBe(false);
    expect(ok('javascript:alert(1)')).toBe(false);
  });
});

describe('compatibility with content saved by 0.2', () => {
  it('fills the fields added in 0.3 with defaults', () => {
    const page = pageSchema.parse({
      title: 'Início',
      slug: 'inicio',
      seo: { title: '', description: '', image: null },
      blocks: [{ id: 'h', type: 'hero', heading: 'Olá', subheading: '', image: null, button: null }],
    });
    expect(page.blocks[0]).toMatchObject({ menuLabel: '', highlight: '', eyebrow: '', secondaryButton: null });
  });

  it('accepts the new landing page blocks', () => {
    const blocks = [
      { id: '1', type: 'features', items: [{ title: 'Direto de fábrica', text: '' }] },
      { id: '2', type: 'numbered-cards', heading: 'Escolha pelo objetivo', highlight: 'objetivo', intro: '', items: [{ title: 'Ganho de massa', text: '' }] },
      { id: '3', type: 'products', heading: 'Mais pedidos', menuLabel: 'Produtos', items: [{ name: 'Whey', category: 'Proteína', tag: '', price: '', image: null }] },
      { id: '4', type: 'steps', heading: 'Comprar é simples', items: [{ title: 'Escolha', text: '' }] },
      { id: '5', type: 'about', eyebrow: '', heading: 'Quem vende entende', text: '', image: null, tags: ['Dica do dia'], link: null },
    ];
    const page = pageSchema.parse({ ...validPage, blocks });
    expect(page.blocks.map((b) => b.type)).toEqual(['features', 'numbered-cards', 'products', 'steps', 'about']);
    expect(page.blocks[2]).toMatchObject({ buttonLabel: 'Pedir este' });
  });
});
