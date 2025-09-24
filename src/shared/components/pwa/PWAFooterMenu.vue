<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, withBase } from 'vitepress';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { storeToRefs } from 'pinia';
import { VNavigationMenuLink } from 'UiKit/components/Base/VNavigationMenu';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';


import HomeIcon    from 'UiKit/assets/images/pwa_specific/home.svg';
import DashboardIcon    from 'UiKit/assets/images/pwa_specific/dashboard__.svg';
import NotificationIcon    from 'UiKit/assets/images/pwa_specific/notification.svg';
import InvestmentIcon from 'UiKit/assets/images/pwa_specific/investment.svg';
import WalletIcon  from 'UiKit/assets/images/pwa_specific/wallet.svg';
import CryptoIcon  from 'UiKit/assets/images/pwa_specific/crypto-wallet.svg';
import HowIcon_     from 'UiKit/assets/images/pwa_specific/info_.svg';
import FaqIcon_     from 'UiKit/assets/images/pwa_specific/faq_.svg';
import {
  urlHome, 
  urlHowItWorks, 
  urlFaq, 
  urlNotifications, 
  urlOffers,
  urlProfileCryptoWallet, 
  urlProfileWallet, 
  urlProfilePortfolio
} from 'InvestCommon/domain/config/links.ts';


defineOptions({ name: 'PWAFooterMenu' });

const route = useRoute();


const sessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(sessionStore);


const isActive = (to: string, baseUrl: string = '/') => {
  const target = withBase(to);

  const origin = typeof window !== 'undefined' ? window.location.origin : baseUrl;
  const targetPath = new URL(target, origin).pathname;

  const p = route.path;
  return p === targetPath || p.startsWith(targetPath + '/');
};

const profilesStore = useProfilesStore();
const { selectedUserProfileId } = storeToRefs(profilesStore);

type Item = { to: string; icon: string, text: string };

const menuItems = computed<Item[]>(() =>
  userLoggedIn.value
  ? [
      { to: urlProfilePortfolio(selectedUserProfileId.value), icon: DashboardIcon, text: 'Dashboard' },  
      { to: urlProfileWallet(selectedUserProfileId.value), icon: WalletIcon, text: 'Wallet' },
      { to: urlOffers, icon: InvestmentIcon, text: 'Invest' },
      { to: urlProfileCryptoWallet(selectedUserProfileId.value), icon: CryptoIcon, text: 'Crypto' },
      { to: urlNotifications, icon: NotificationIcon, text: 'Notifications' },  
    ]
  : [
      { to: urlHome, icon: HomeIcon, text: 'Home' },  
      { to: urlOffers, icon: InvestmentIcon, text: 'Invest' },
      { to: urlHowItWorks, icon: HowIcon_, text: 'Help' },   
      { to: urlFaq, icon: FaqIcon_, text: 'FAQ' },   
    ]
);
</script>

<template>
  <nav
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
  --pwamenu-bg: rgba(243, 243, 243, 0.96);
  --pwamenu-border: rgba(255, 255, 255, 0.05);
  --pwamenu-shadow: 0 10px 30px rgba(0, 0, 0, 0.24), 0 2px 8px rgba(0,0,0,0.08);
}

.pwamenu { display: block; } // fix it
@media (max-width: 768px) {
  body.pwa-standalone .pwamenu { display: block; }
}

.pwamenu {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding-inline: var(--pwamenu-gx);
  padding-bottom: calc(var(--pwamenu-gb) + env(safe-area-inset-bottom));
  z-index: 110; 
  pointer-events: none;

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
      background: rgba(17,24,39,0.06);

      .pwamenu__label {
        font-weight: 600;  
        color: #111827;    
      }
    }
  }
}


</style>
  