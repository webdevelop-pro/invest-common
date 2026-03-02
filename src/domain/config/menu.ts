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
  () => (profileId?: number | null, path?: string) => {
    const items: MenuItem[] = [];

    const hasProfile = Number.isFinite(profileId as number);
    const id = hasProfile ? Number(profileId) : undefined;

    if (hasProfile && id !== undefined) {
      const dashboardHref = urlProfilePortfolio(id);
      const profileHref = urlProfileAccount(id);
      const walletHref = urlProfileWallet(id);

      items.push(
        {
          href: dashboardHref,
          text: 'Dashboard',
          icon: DashboardMenuIcon,
          active: dashboardHref === path,
        },
        {
          href: profileHref,
          text: 'Profile',
          icon: ProfileMenuIcon,
          active: profileHref === path,
        },
        {
          href: walletHref,
          text: 'Wallet',
          icon: WalletMenuIcon,
          active: walletHref === path,
        },
      );
    }

    const exploreHref = urlOffers;
    const howItWorksHref = urlHowItWorks;
    const blogHref = urlBlog;
    const faqHref = urlFaq;

    items.push(
      {
        href: exploreHref,
        text: 'Explore',
        icon: ExploreMenuIcon,
        active: exploreHref === path,
      },
      {
        href: howItWorksHref,
        text: 'How It Works',
        icon: HowItWorksMenuIcon,
        active: howItWorksHref === path,
      },
      {
        href: blogHref,
        text: 'Resource center',
        icon: ResourceCenterMenuIcon,
        active: blogHref === path,
      },
      {
        href: faqHref,
        text: 'FAQ',
        icon: FaqMenuIcon,
        active: faqHref === path,
      },
    );

    if (hasProfile && id !== undefined) {
      const settingsHref = urlSettings(id);

      items.push({
        href: settingsHref,
        text: 'Settings',
        class: 'is--border-top',
        icon: SettingsMenuIcon,
        active: settingsHref === path,
      });
    }

    return items;
  },
);
