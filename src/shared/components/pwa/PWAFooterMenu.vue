<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { storeToRefs } from 'pinia';
import { VNavigationMenuLink } from 'UiKit/components/Base/VNavigationMenu';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useNotifications } from 'InvestCommon/features/notifications/store/useNotifications';

import HomeIcon from 'UiKit/assets/images/menu_common/home.svg';
import InvestmentIcon from 'UiKit/assets/images/menu_common/investments.svg';
import PortfolioIcon from 'UiKit/assets/images/menu_common/portfolio.svg';
import WalletIcon from 'UiKit/assets/images/menu_common/wallet.svg';
import CryptoIcon from 'UiKit/assets/images/menu_common/crypto1.svg';
import HelpIcon from 'UiKit/assets/images/menu_common/help.svg';
import FaqIcon from 'UiKit/assets/images/menu_common/faq.svg';
import {
  urlHome, 
  urlHowItWorks, 
  urlFaq, 
  urlOffers,
  urlProfileCryptoWallet, 
  urlProfileSummary,
  urlProfileWallet, 
  urlProfilePortfolio
} from 'InvestCommon/domain/config/links';


defineOptions({ name: 'PWAFooterMenu' });

const props = defineProps<{
  currentPath?: string
  currentLayout?: string
  withBase?: (to: string) => string
  baseUrl?: string
}>();

const fallbackPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search + window.location.hash : '/';
const currentPath = computed(() => (props.currentPath ?? fallbackPath));

function defaultWithBase(to: string): string {

  if (/^(https?:)?\/\//i.test(to) || /^[a-z]+:/i.test(to)) return to;
  return to.startsWith('/') ? to : `/${to}`;

}

const withBaseUniversal = (to: string) => (props.withBase ? props.withBase(to) : defaultWithBase(to));

const layoutActiveFallbackMap: Record<string, string[]> = {
  'offer-single': [urlOffers],
};

function getProfileSectionKey(pathname: string): string | null {
  const match = pathname.match(/\/profile\/[^/]+\/([^/]+)/);
  return match ? `profile/${match[1]}` : null;
}

function isActive(to: string): boolean {

  const target = withBaseUniversal(to);
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : (props.baseUrl ?? '/');

  const targetPath = new URL(target, origin).pathname;

  const p = (currentPath.value || '/').split('#')[0].split('?')[0];

  if (p === targetPath || p.startsWith(`${targetPath}/`)) {
    return true;
  }

  const currentProfileSection = getProfileSectionKey(p);
  const targetProfileSection = getProfileSectionKey(targetPath);
  if (currentProfileSection && targetProfileSection && currentProfileSection === targetProfileSection) {
    return true;
  }

  const layout = props.currentLayout;
  if (!layout) return false;

  const layoutFallbackTargets = layoutActiveFallbackMap[layout];

  return layoutFallbackTargets?.includes(to) ?? false;

}

const sessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(sessionStore);

const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);
const notificationsStore = useNotifications();
const { isSidebarOpen } = storeToRefs(notificationsStore);

type Item = { to: string; icon: Component; text: string };

const menuItems = computed<Item[]>(() =>
  userLoggedIn.value
  ? [
      { to: urlProfileSummary(selectedUserProfileId.value), icon: HomeIcon, text: 'Home' },  
      { to: urlProfilePortfolio(selectedUserProfileId.value), icon: PortfolioIcon, text: 'Portfolio' },
      { to: urlProfileWallet(selectedUserProfileId.value), icon: WalletIcon, text: 'Wallet' },
      { to: urlOffers, icon: InvestmentIcon, text: 'Invest' },
      { to: urlProfileCryptoWallet(selectedUserProfileId.value), icon: CryptoIcon, text: 'Crypto' },
    ]
  : [
      { to: urlHome, icon: HomeIcon, text: 'Home' },  
      { to: urlOffers, icon: InvestmentIcon, text: 'Invest' },
      { to: urlHowItWorks, icon: HelpIcon, text: 'Help' },   
      { to: urlFaq, icon: FaqIcon, text: 'FAQ' },   
    ]
);

const shouldHideMenu = computed(() => (
  isSidebarOpen.value
  || props.currentLayout === 'offer-single'
));
</script>

<template>
  <nav
    v-if="!shouldHideMenu"
    class="pwamenu"
    role="navigation"
    aria-label="PWA Bottom Menu"
  >
    <ul
      :class="['pwamenu__list', menuItems.length === 5 ? 'cols-5' : 'cols-4']"
    >
      <li
        v-for="item in menuItems"
        :key="item.to"
        class="pwamenu__item"
      >
        <VNavigationMenuLink 
          :href="item.to"
          :class="['pwamenu__link', isActive(item.to) ? 'is-active' : '']"
        >
          <component
            :is="item.icon"
            class="pwamenu__icon"
            aria-hidden="true"
          />
          <span class="pwamenu__label">{{ item.text }}</span>
        </VNavigationMenuLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped lang="scss">
:host, .pwamenu {
  --pwamenu-gx: 12px;
  --pwamenu-gb: 12px;
  --pwamenu-radius: 16px;
  --pwamenu-bg: rgb(243 243 243 / 96%);
  --pwamenu-border: rgb(255 255 255 / 5%);
  --pwamenu-shadow: 0 10px 30px rgb(0 0 0 / 24%), 0 2px 8px rgb(0 0 0 / 8%);
}

@media (width <= 768px) {
  body.pwa-standalone .pwamenu { display: block; }
}

.pwamenu {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding-inline: var(--pwamenu-gx);
  padding-bottom: calc(var(--pwamenu-gb) + env(safe-area-inset-bottom));
  z-index: 110; 
  pointer-events: none;
  display: block;// fix it

  &.is-hidden {
    display: none;
  }

  .pwamenu__list {
    pointer-events: auto;
    list-style: none;
    margin: 0;
    padding: 8px;
    display: grid;
    gap: 6px;
    background: var(--pwamenu-bg);
    border: 1px solid var(--pwamenu-border);
    border-radius: var(--pwamenu-radius);
    box-shadow: var(--pwamenu-shadow);
    backdrop-filter: blur(6px);

    &.cols-5 { grid-template-columns: repeat(5, 1fr); }

    &.cols-4 { grid-template-columns: repeat(4, 1fr); }
  }

  .pwamenu__item { display: flex; }

  

  .pwamenu__link {
    width: 100%;
    padding: 8px 0;
    border-radius: 12px;
    display: flex;
    flex-direction: column; 
    align-items: center;
    justify-content: center;
    text-decoration: none; 
    color: inherit;        
    transition: background .2s ease, color .2s ease;

    .pwamenu__icon {
      width: 24px;
      height: 24px;
      display: block;
      margin-bottom: 4px;
      color: #000 !important;
    }

    .pwamenu__label {
      font-size: 12px;     
      line-height: 1.2;
      color: #000;         
      text-decoration: none;
    }

    &.is-active {
      background: rgb(17 24 39 / 6%);

      .pwamenu__label {
        font-weight: 600;  
        color: #111827;    
      }
    }

    .pwamenu__notification-badge {
      top: 4px;
      right: 50%;
      transform: translateX(calc(50% + 8px));
    }
  }
}


</style>
  
