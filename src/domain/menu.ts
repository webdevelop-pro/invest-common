import {
  urlBlog, urlContactUs, urlFaq, urlHowItWorks, urlOffers,
  urlCookie, urlPrivacy, urlTerms,
} from 'InvestCommon/global/links';
import { computed } from 'vue';

export type MenuItem = {
  to?: string;
  href?: string;
  text: string;
  children?: MenuItem[];
}
export const MENU_HEADER_RIGHT = computed(() => ([
  {
    href: urlOffers,
    text: 'Explore',
  },
  {
    href: urlHowItWorks,
    text: 'How It Works',
  },
  {
    href: urlBlog,
    text: 'Resource center',
  },
  {
    href: urlFaq,
    text: 'FAQ',
  },
]));

export const MENU_FOOTER: MenuItem[] = [
  {
    href: urlHowItWorks,
    text: 'How It Works',
  },
  {
    href: urlBlog,
    text: 'Resource center',
  },
  {
    href: urlFaq,
    text: 'FAQ',
  },
  {
    href: urlOffers,
    text: 'About',
  },
  {
    href: urlContactUs,
    text: 'Contact Us',
  },
];

export const MENU_LEGAL = [
  {
    href: urlTerms,
    text: 'Terms of Service',
  },
  {
    href: urlPrivacy,
    text: 'Privacy Notice',
  },
  {
    href: urlCookie,
    text: 'Cookie Policy',
  },
];
