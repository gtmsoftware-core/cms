'use client';

import type { ComponentType } from 'react';
import type { BlockType } from '@/application/content';
import { AboutBlockForm } from './about-block-form';
import { ContactBlockForm } from './contact-block-form';
import { CtaBlockForm } from './cta-block-form';
import { FaqBlockForm } from './faq-block-form';
import { FeaturesBlockForm } from './features-block-form';
import { GalleryBlockForm } from './gallery-block-form';
import { HeroBlockForm } from './hero-block-form';
import { NumberedCardsBlockForm } from './numbered-cards-block-form';
import { ProductsBlockForm } from './products-block-form';
import { RichTextBlockForm } from './rich-text-block-form';
import { ServicesListBlockForm } from './services-list-block-form';
import { StepsBlockForm } from './steps-block-form';
import { TestimonialsBlockForm } from './testimonials-block-form';

/** One form per block type. To add a block: SDK schema, catalog entry and a form here. */
const FORMS: Readonly<Record<BlockType, ComponentType<{ index: number }>>> = {
  hero: HeroBlockForm,
  'rich-text': RichTextBlockForm,
  features: FeaturesBlockForm,
  'numbered-cards': NumberedCardsBlockForm,
  'services-list': ServicesListBlockForm,
  products: ProductsBlockForm,
  steps: StepsBlockForm,
  about: AboutBlockForm,
  gallery: GalleryBlockForm,
  testimonials: TestimonialsBlockForm,
  faq: FaqBlockForm,
  contact: ContactBlockForm,
  cta: CtaBlockForm,
};

export function BlockForm({ type, index }: { type: BlockType; index: number }) {
  const Form = FORMS[type];
  return <Form index={index} />;
}
