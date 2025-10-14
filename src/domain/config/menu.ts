import {
  urlBlog, urlContactUs, urlFaq, urlHowItWorks, urlOffers,
  urlCookie, urlPrivacy, urlTerms,
} from 'InvestCommon/domain/config/links';
import { computed } from 'vue';
import type { MenuItem } from 'InvestCommon/types/global';
import ExploreMenuIcon from 'UiKit/assets/images/menu_common/investments.svg';
import HowItWorksMenuIcon from 'UiKit/assets/images/menu_common/help.svg';
import ResourceCenterMenuIcon from 'UiKit/assets/images/menu_common/crypto2.svg';
import FaqMenuIcon from 'UiKit/assets/images/menu_common/faq.svg';

export type { MenuItem } from 'InvestCommon/types/global';

export const MENU_HEADER_RIGHT = computed(() => ([
  {
    href: urlOffers,
    text: 'Explore',
    icon: ExploreMenuIcon,
  },
  {
    href: urlHowItWorks,
    text: 'How It Works',
    icon: HowItWorksMenuIcon,
  },
  {
    href: urlBlog,
    text: 'Resource center',
    icon: ResourceCenterMenuIcon,
  },
  {
    href: urlFaq,
    text: 'FAQ',
    icon: FaqMenuIcon,
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
