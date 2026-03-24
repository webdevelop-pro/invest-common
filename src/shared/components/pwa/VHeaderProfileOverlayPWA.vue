<script setup lang="ts">
import { computed, type Component } from 'vue';
import VAvatar from 'UiKit/components/VAvatar.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import ArrowRight from 'UiKit/assets/images/chevron-right.svg';
import ContactIcon from 'UiKit/assets/images/message.svg';
import FaqIcon from 'UiKit/assets/images/menu_common/faq.svg';
import UserIcon from 'UiKit/assets/images/menu_common/user.svg';
import GearIcon from 'UiKit/assets/images/menu_common/gear.svg';
import HelpIcon from 'UiKit/assets/images/menu_common/help.svg';
import LogoutIcon from 'UiKit/assets/images/menu_common/logout.svg';

const props = defineProps<{
  email?: string;
  avatarSrc?: string;
  avatarLoading?: boolean;
  accountDetailsHref?: string;
  mfaHref?: string;
  securityHref?: string;
  howItWorksHref?: string;
  faqHref?: string;
  contactHref?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'logout'): void;
  (e: 'avatar-click'): void;
}>();

type OverlayItemBase = {
  id: string;
  label: string;
  icon: Component;
  className?: string;
};

type OverlayLinkItem = OverlayItemBase & {
  type: 'link';
  href: string;
};

type OverlayActionItem = OverlayItemBase & {
  type: 'action';
  action: 'logout';
};

type OverlayItem = OverlayLinkItem | OverlayActionItem;

type OverlayGroup = {
  id: string;
  ariaLabel: string;
  sectionClassName?: string;
  items: OverlayItem[];
};

const toLinkItem = (item: Omit<OverlayLinkItem, 'type'>): OverlayLinkItem | null => {
  if (!item.href) {
    return null;
  }

  return {
    ...item,
    type: 'link',
  };
};

const isOverlayItem = (item: OverlayItem | null): item is OverlayItem => item !== null;

const overlayGroups = computed<OverlayGroup[]>(() => [
  {
    id: 'settings',
    ariaLabel: 'Account settings',
    items: [
      toLinkItem({
        id: 'mfa',
        href: props.mfaHref ?? '',
        label: 'MFA & Password',
        icon: UserIcon,
      }),
      toLinkItem({
        id: 'security',
        href: props.securityHref ?? '',
        label: 'Account Security',
        icon: GearIcon,
      }),
    ].filter(isOverlayItem),
  },
  {
    id: 'support',
    ariaLabel: 'Support',
    items: [
      toLinkItem({
        id: 'how-it-works',
        href: props.howItWorksHref ?? '',
        label: 'How It Works',
        icon: HelpIcon,
      }),
      toLinkItem({
        id: 'faq',
        href: props.faqHref ?? '',
        label: 'FAQ',
        icon: FaqIcon,
      }),
      toLinkItem({
        id: 'contact',
        href: props.contactHref ?? '',
        label: 'Contact Us',
        icon: ContactIcon,
      }),
    ].filter(isOverlayItem),
  },
  {
    id: 'account-actions',
    ariaLabel: 'Account actions',
    sectionClassName: 'v-header-profile-pwa__overlay-section--logout',
    items: [
      {
        id: 'logout',
        type: 'action',
        action: 'logout',
        label: 'Log Out',
        icon: LogoutIcon,
        className: 'v-header-profile-pwa__overlay-item--logout',
      },
    ],
  },
].filter((group) => group.items.length));

const onOverlayItemClick = (item: OverlayActionItem) => {
  if (item.action === 'logout') {
    emit('logout');
  }
};
</script>

<template>
  <Teleport to="body">
    <div
      class="VHeaderProfileOverlayPWA v-header-profile-pwa__overlay"
      role="dialog"
      aria-modal="true"
    >
      <div class="v-header-profile-pwa__overlay-header">
        <button
          type="button"
          class="v-header-profile-pwa__overlay-close"
          aria-label="Close"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>
      <div class="v-header-profile-pwa__overlay-body">
        <div class="v-header-profile-pwa__overlay-content">
          <section class="v-header-profile-pwa__overlay-profile-panel">
            <div class="v-header-profile-pwa__overlay-profile">
              <button
                type="button"
                class="v-header-profile-pwa__overlay-avatar-btn"
                aria-label="Upload avatar"
                @click="emit('avatar-click')"
              >
                <VAvatar
                  size="small"
                  :src="avatarSrc"
                  :loading="avatarLoading"
                  alt="avatar image"
                  class="v-header-profile-pwa__overlay-avatar"
                />
              </button>
              <div class="v-header-profile-pwa__overlay-email is--h6__title">
                {{ email }}
              </div>
              <VButton
                v-if="accountDetailsHref"
                as="a"
                :href="accountDetailsHref"
                size="small"
                color="primary"
                variant="link"
                class="v-header-profile-pwa__overlay-link"
              >
                Account Details
              </VButton>
            </div>
          </section>

          <section
            class="v-header-profile-pwa__overlay-section"
          >
            <div
              v-for="group in overlayGroups"
              :key="group.id"
              class="v-header-profile-pwa__overlay-group"
              :class="group.sectionClassName"
              :aria-label="group.ariaLabel"
            >
              <template
                v-for="item in group.items"
                :key="item.id"
              >
                <a
                  v-if="item.type === 'link'"
                  :href="item.href"
                  class="v-header-profile-pwa__overlay-item"
                  :class="item.className"
                >
                  <span class="v-header-profile-pwa__overlay-icon-box">
                    <component
                      :is="item.icon"
                      class="v-header-profile-pwa__overlay-icon"
                      aria-hidden="true"
                    />
                  </span>
                  <span class="v-header-profile-pwa__overlay-item-label  is--h6__title">
                    {{ item.label }}
                  </span>
                  <ArrowRight
                    class="v-header-profile-pwa__overlay-chevron"
                    aria-hidden="true"
                  />
                </a>
                <button
                  v-else
                  type="button"
                  class="v-header-profile-pwa__overlay-item"
                  :class="item.className"
                  @click="onOverlayItemClick(item)"
                >
                  <span class="v-header-profile-pwa__overlay-icon-box">
                    <component
                      :is="item.icon"
                      class="v-header-profile-pwa__overlay-icon"
                      aria-hidden="true"
                    />
                  </span>
                  <span class="v-header-profile-pwa__overlay-item-label  is--h6__title">
                    {{ item.label }}
                  </span>
                  <ArrowRight
                    class="v-header-profile-pwa__overlay-chevron"
                    aria-hidden="true"
                  />
                </button>
              </template>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.v-header-profile-pwa {
  &__overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    background: $white;
    padding: 0;
  }

  &__overlay-header {
    min-height: $header-height;
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: $white;
    box-shadow: $box-shadow-small;
    position: relative;
    z-index: 1;
  }

  &__overlay-body {
    flex: 1;
    overflow: auto;
    background: $white;
  }

  &__overlay-content {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - $header-height);
    padding-bottom: 32px;
  }

  &__overlay-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 16px;
    background: transparent;
    color: $gray-80;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  }

  &__overlay-avatar {
    margin-bottom: 0;
  }

  &__overlay-avatar-btn {
    padding: 0;
    background: transparent;
    cursor: pointer;
  }

  &__overlay-profile-panel {
    display: flex;
    justify-content: center;
    padding: 24px;
    background: $gray-10;
  }

  &__overlay-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 100%;
    max-width: 320px;
    text-align: center;
  }

  &__overlay-email {
    overflow-wrap: anywhere;
  }

  &__overlay-link {
    margin-top: 4px;
  }

  &__overlay-section {
    width: 100%;
    padding: 5px 0;
  }

  &__overlay-group {
    padding: 20px 12px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    border-top: 1px solid $gray-20;

    &:first-of-type {
      border-top: none;
    }
  }

  &__overlay-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    color: $black;
    cursor: pointer;
    text-decoration: none;
  }

  &__overlay-icon-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 1px solid $gray-20;
    border-radius: 4px;
    background: $white;
    color: $gray-80;
    flex-shrink: 0;
  }

  &__overlay-icon {
    width: 16px;
    height: 16px;
  }

  &__overlay-chevron {
    margin-left: auto;
    width: 18px;
    height: 18px;
    color: $gray-60;
    flex-shrink: 0;
    margin-right: 4px;
  }
}
</style>
