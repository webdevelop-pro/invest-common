import {
  urlBlog,
  urlContactUs,
  urlFaq,
  urlHowItWorks,
  urlOffers,
  urlCookie,
  urlPrivacy,
  urlTerms,
  urlProfilePortfolio,
  urlProfileAccount,
  urlProfileWallet,
  urlSettings,
} from 'InvestCommon/domain/config/links';
import { computed } from 'vue';
import ExploreMenuIcon from 'UiKit/assets/images/menu_common/investments.svg';
import HowItWorksMenuIcon from 'UiKit/assets/images/menu_common/help.svg';
import ResourceCenterMenuIcon from 'UiKit/assets/images/menu_common/crypto2.svg';
import FaqMenuIcon from 'UiKit/assets/images/menu_common/faq.svg';
import DashboardMenuIcon from 'UiKit/assets/images/menu_common/grid.svg';
import ProfileMenuIcon from 'UiKit/assets/images/menu_common/user.svg';
import WalletMenuIcon from 'UiKit/assets/images/menu_common/wallet.svg';
import SettingsMenuIcon from 'UiKit/assets/images/menu_common/gear.svg';
import type { MenuItem } from 'InvestCommon/types/global';

export const MENU_HEADER_RIGHT = computed(() => (path: string) => [
  {
    href: urlOffers,
    text: 'Explore',
    icon: ExploreMenuIcon,
    active: urlOffers === path,
  },
  {
    href: urlHowItWorks,
    text: 'How It Works',
    icon: HowItWorksMenuIcon,
    active: urlHowItWorks === path,
  },
  {
    href: urlBlog,
    text: 'Resource center',
    icon: ResourceCenterMenuIcon,
    active: urlBlog === path,
  },
  {
    href: urlFaq,
    text: 'FAQ',
    icon: FaqMenuIcon,
    active: urlFaq === path,
  },
]);

export const MENU_FOOTER = computed(
  () => (path: string) => [{
    children: [
      {
        href: urlHowItWorks,
        text: 'How It Works',
        active: urlHowItWorks === path,
      },
      {
        href: urlBlog,
        text: 'Resource center',
        active: urlBlog === path,
      },
      {
        href: urlFaq,
        text: 'FAQ',
        active: urlFaq === path,
      },
      // {
      //   href: urlOffers,
      //   text: 'About',
      //   active: urlOffers === path,
      // },
      {
        href: urlContactUs,
        text: 'Contact Us',
        active: urlContactUs === path,
      },
    ],
  }],
);

export const MENU_LEGAL = computed(() => (path: string) => [
  {
    href: urlTerms,
    text: 'Terms of Service',
    active: urlTerms === path,
  },
  {
    href: urlPrivacy,
    text: 'Privacy Notice',
    active: urlPrivacy === path,
  },
  {
    href: urlCookie,
    text: 'Cookie Policy',
    active: urlCookie === path,
  },
]);

export const MENU_HEADER_MOBILE = computed(
  () => (profileId?: number | null) => {
    const items: MenuItem[] = [];

    const hasProfile = Number.isFinite(profileId as number);
    const id = hasProfile ? Number(profileId) : undefined;

    if (hasProfile && id !== undefined) {
      items.push(
        {
          href: urlProfilePortfolio(id),
          text: 'Dashboard',
          icon: DashboardMenuIcon,
        },
        {
          href: urlProfileAccount(id),
          text: 'Profile',
          icon: ProfileMenuIcon,
        },
        {
          href: urlProfileWallet(id),
          text: 'Wallet',
          icon: WalletMenuIcon,
        },
      );
    }

    items.push(
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
    );

    if (hasProfile && id !== undefined) {
      items.push({
        href: urlSettings(id),
        text: 'Settings',
        class: 'is--border-top',
        icon: SettingsMenuIcon,
      });
    }

    return items;
  },
);
