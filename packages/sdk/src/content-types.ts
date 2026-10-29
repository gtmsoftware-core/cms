import { z } from 'zod';
import { richTextSchema, SAFE_HREF } from './rich-text';

/*
 * Content types shared by the CMS and the sites. Validation messages are in Portuguese because the
 * CMS shows them to editors. Optional text fields use '' when empty; optional groups use null.
 */

const requiredText = (max: number) =>
  z.string().trim().min(1, 'Campo obrigatório.').max(max, `Use no máximo ${max} caracteres.`);

const optionalText = (max: number) => z.string().trim().max(max, `Use no máximo ${max} caracteres.`);

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || /^https:\/\/\S+$/.test(value), 'Informe um endereço que comece com https://.');

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Campo obrigatório.')
  .max(63, 'Use no máximo 63 caracteres.')
  .regex(SLUG_PATTERN, 'Use letras minúsculas, números e hífens. Ex.: "nossos-servicos".');

/** HTTPS addresses, plus plain HTTP on localhost so the CMS can serve its local media library in development. */
const IMAGE_URL = /^(https:\/\/\S+|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/\S*)$/;

export const imageSchema = z.object({
  url: z.string().trim().regex(IMAGE_URL, 'Informe o endereço da imagem, começando com https://.'),
  alt: optionalText(200),
});

export type Image = z.infer<typeof imageSchema>;

export const linkSchema = z.object({
  label: requiredText(60),
  href: z
    .string()
    .trim()
    .regex(SAFE_HREF, 'Use https://, mailto:, tel: ou um caminho como /contato.'),
});

export type Link = z.infer<typeof linkSchema>;

/* ---------- Blocks ---------- */

const atLeastOne = 'Adicione pelo menos um item.';

/*
 * Fields added after 0.2 carry defaults, so content saved by older versions stays valid.
 * `menuLabel`: when filled, the section gets an anchor and appears in the site's menu.
 * `highlight`: words of the heading shown in the accent color.
 */
const blockBase = {
  id: z.string().min(1),
  menuLabel: optionalText(30).default(''),
};

const highlight = optionalText(60).default('');

const titledItem = z.object({ title: requiredText(80), text: optionalText(300) });

export const heroBlockSchema = z.object({
  ...blockBase,
  type: z.literal('hero'),
  eyebrow: optionalText(60).default(''),
  heading: requiredText(120),
  highlight,
  subheading: optionalText(300),
  image: imageSchema.nullable(),
  button: linkSchema.nullable(),
  secondaryButton: linkSchema.nullable().default(null),
});

export const richTextBlockSchema = z.object({
  ...blockBase,
  type: z.literal('rich-text'),
  content: richTextSchema,
});

/** Short benefits shown side by side in a colored strip. */
export const featuresBlockSchema = z.object({
  ...blockBase,
  type: z.literal('features'),
  items: z.array(titledItem).min(1, atLeastOne).max(8),
});

/** Cards numbered 01, 02... (goals, reasons, specialties). */
export const numberedCardsBlockSchema = z.object({
  ...blockBase,
  type: z.literal('numbered-cards'),
  heading: optionalText(120),
  highlight,
  intro: optionalText(300),
  items: z.array(titledItem).min(1, atLeastOne).max(12),
});

export const servicesListBlockSchema = z.object({
  ...blockBase,
  type: z.literal('services-list'),
  heading: optionalText(120),
  highlight,
  items: z
    .array(z.object({ title: requiredText(80), description: optionalText(500), price: optionalText(40) }))
    .min(1, atLeastOne)
    .max(30),
});

/** Product cards with photo, label and price; each button opens WhatsApp asking for that product. */
export const productsBlockSchema = z.object({
  ...blockBase,
  type: z.literal('products'),
  heading: optionalText(120),
  highlight,
  buttonLabel: requiredText(40).default('Pedir este'),
  items: z
    .array(
      z.object({
        name: requiredText(100),
        category: optionalText(40),
        tag: optionalText(30),
        price: optionalText(40),
        image: imageSchema.nullable(),
      }),
    )
    .min(1, atLeastOne)
    .max(40),
});

/** Numbered steps of a process ("how to buy"). */
export const stepsBlockSchema = z.object({
  ...blockBase,
  type: z.literal('steps'),
  heading: optionalText(120),
  highlight,
  items: z.array(titledItem).min(1, atLeastOne).max(8),
});

/** Photo beside a text, with tags and an optional link (about us, the professional, the team). */
export const aboutBlockSchema = z.object({
  ...blockBase,
  type: z.literal('about'),
  eyebrow: optionalText(60),
  heading: requiredText(120),
  highlight,
  text: optionalText(1500),
  image: imageSchema.nullable(),
  tags: z.array(requiredText(40)).max(12),
  link: linkSchema.nullable(),
});

export const galleryBlockSchema = z.object({
  ...blockBase,
  type: z.literal('gallery'),
  heading: optionalText(120),
  highlight,
  images: z.array(imageSchema).min(1, atLeastOne).max(30),
});

export const testimonialsBlockSchema = z.object({
  ...blockBase,
  type: z.literal('testimonials'),
  heading: optionalText(120),
  highlight,
  items: z
    .array(z.object({ author: requiredText(80), quote: requiredText(600), role: optionalText(80) }))
    .min(1, atLeastOne)
    .max(30),
});

export const faqBlockSchema = z.object({
  ...blockBase,
  type: z.literal('faq'),
  heading: optionalText(120),
  highlight,
  items: z
    .array(z.object({ question: requiredText(200), answer: requiredText(1000) }))
    .min(1, atLeastOne)
    .max(50),
});

export const contactBlockSchema = z.object({
  ...blockBase,
  type: z.literal('contact'),
  heading: optionalText(120),
  highlight,
  text: optionalText(500),
  showMap: z.boolean(),
});

export const ctaBlockSchema = z.object({
  ...blockBase,
  type: z.literal('cta'),
  heading: requiredText(120),
  highlight,
  text: optionalText(300),
  button: linkSchema,
  secondaryButton: linkSchema.nullable().default(null),
});

export const blockSchema = z.discriminatedUnion('type', [
  heroBlockSchema,
  richTextBlockSchema,
  featuresBlockSchema,
  numberedCardsBlockSchema,
  servicesListBlockSchema,
  productsBlockSchema,
  stepsBlockSchema,
  aboutBlockSchema,
  galleryBlockSchema,
  testimonialsBlockSchema,
  faqBlockSchema,
  contactBlockSchema,
  ctaBlockSchema,
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockInput = z.input<typeof blockSchema>;
export type BlockType = Block['type'];
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;

export const BLOCK_TYPES = [
  'hero',
  'rich-text',
  'features',
  'numbered-cards',
  'services-list',
  'products',
  'steps',
  'about',
  'gallery',
  'testimonials',
  'faq',
  'contact',
  'cta',
] as const satisfies readonly BlockType[];

/**
 * Button addresses with this value open the WhatsApp number of the site settings,
 * so editors never type wa.me links by hand.
 */
export const WHATSAPP_HREF = '#whatsapp';

/* ---------- Page ---------- */

export const pageSchema = z.object({
  title: requiredText(120),
  slug: slugSchema,
  seo: z.object({
    title: optionalText(70),
    description: optionalText(160),
    image: imageSchema.nullable(),
  }),
  blocks: z.array(blockSchema).max(50, 'Use no máximo 50 blocos por página.'),
});

export type Page = z.infer<typeof pageSchema>;

/* ---------- Site settings (singleton) ---------- */

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor no formato #RRGGBB.');

export const siteSettingsSchema = z.object({
  businessName: requiredText(120),
  logo: imageSchema.nullable(),
  colors: z.object({ primary: hexColor, secondary: hexColor }),
  contact: z.object({
    phone: optionalText(30),
    whatsapp: optionalText(30),
    email: z
      .string()
      .trim()
      .refine((value) => value === '' || z.email().safeParse(value).success, 'Informe um e-mail válido.'),
  }),
  address: z.object({
    street: optionalText(160),
    city: optionalText(80),
    state: optionalText(40),
    postalCode: optionalText(20),
  }),
  social: z.object({
    instagram: optionalUrl,
    facebook: optionalUrl,
    linkedin: optionalUrl,
    youtube: optionalUrl,
    tiktok: optionalUrl,
  }),
  openingHours: z.array(z.object({ days: requiredText(40), hours: requiredText(40) })).max(14),
  /** Small print in the footer, e.g. "Suplementos & Naturais · Natuba-PB · CNPJ ...". */
  footerNote: optionalText(200).default(''),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const CONTENT_TYPES = ['page', 'site-settings'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
