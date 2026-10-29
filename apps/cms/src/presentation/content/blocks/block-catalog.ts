import type { Block, BlockOf, BlockType } from '@/application/content';
import { emptyRichText } from '@/application/content/schemas/page.schema';

export const BLOCK_LABELS: Readonly<Record<BlockType, string>> = {
  hero: 'Destaque (topo da página)',
  'rich-text': 'Texto',
  features: 'Faixa de diferenciais',
  'numbered-cards': 'Cartões numerados',
  'services-list': 'Serviços',
  products: 'Produtos',
  steps: 'Passo a passo',
  about: 'Sobre (foto e texto)',
  gallery: 'Galeria de fotos',
  testimonials: 'Depoimentos',
  faq: 'Perguntas frequentes',
  contact: 'Contato',
  cta: 'Chamada para ação',
};

const base = (id: string) => ({ id, menuLabel: '' });
const titled = () => ({ title: '', text: '' });
const whatsappButton = () => ({ label: 'Pedir no WhatsApp', href: '#whatsapp' });

const factories: { [T in BlockType]: (id: string) => BlockOf<T> } = {
  hero: (id) => ({
    ...base(id),
    type: 'hero',
    eyebrow: '',
    heading: '',
    highlight: '',
    subheading: '',
    image: null,
    button: whatsappButton(),
    secondaryButton: null,
  }),
  'rich-text': (id) => ({ ...base(id), type: 'rich-text', content: emptyRichText() }),
  features: (id) => ({ ...base(id), type: 'features', items: [titled()] }),
  'numbered-cards': (id) => ({ ...base(id), type: 'numbered-cards', heading: '', highlight: '', intro: '', items: [titled()] }),
  'services-list': (id) => ({ ...base(id), type: 'services-list', heading: '', highlight: '', items: [newService()] }),
  products: (id) => ({ ...base(id), type: 'products', heading: '', highlight: '', buttonLabel: 'Pedir este', items: [newProduct()] }),
  steps: (id) => ({ ...base(id), type: 'steps', heading: '', highlight: '', items: [titled()] }),
  about: (id) => ({ ...base(id), type: 'about', eyebrow: '', heading: '', highlight: '', text: '', image: null, tags: [], link: null }),
  gallery: (id) => ({ ...base(id), type: 'gallery', heading: '', highlight: '', images: [blankImage()] }),
  testimonials: (id) => ({ ...base(id), type: 'testimonials', heading: '', highlight: '', items: [newTestimonial()] }),
  faq: (id) => ({ ...base(id), type: 'faq', heading: '', highlight: '', items: [newQuestion()] }),
  contact: (id) => ({ ...base(id), type: 'contact', heading: 'Fale com a gente', highlight: '', text: '', showMap: true }),
  cta: (id) => ({ ...base(id), type: 'cta', heading: '', highlight: '', text: '', button: whatsappButton(), secondaryButton: null }),
};

export function newBlock(type: BlockType): Block {
  return factories[type](crypto.randomUUID());
}

const blankImage = () => ({ url: '', alt: '' });

export const newTitledItem = titled;
export const newService = () => ({ title: '', description: '', price: '' });
export const newProduct = () => ({ name: '', category: '', tag: '', price: '', image: null });
export const newTestimonial = () => ({ author: '', quote: '', role: '' });
export const newQuestion = () => ({ question: '', answer: '' });
export const newImage = blankImage;
