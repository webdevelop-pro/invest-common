<script setup lang="ts">
import VAvatar from 'UiKit/components/VAvatar.vue';
import ArrowRight from 'UiKit/assets/images/arrow-right.svg';
import UserIcon from 'UiKit/assets/images/menu_common/user.svg';
import GearIcon from 'UiKit/assets/images/menu_common/gear.svg';
import HelpIcon from 'UiKit/assets/images/menu_common/help.svg';
import FaqIcon from 'UiKit/assets/images/menu_common/faq.svg';
import LogoutIcon from 'UiKit/assets/images/menu_common/logout.svg';

defineProps<{
  email?: string;
  avatarSrc?: string;
  accountDetailsHref?: string;
  mfaHref?: string;
  securityHref?: string;
  helpHref?: string;
  contactHref?: string;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'logout'): void;
}>();
</script>

<template>
  <Teleport to="body">
    <div
      class="VHeaderProfileOverlayPWA v-header-profile-pwa__overlay view-contact-us"
      role="dialog"
      aria-modal="true"
    >
      <div class="v-header-profile-pwa__overlay-header">
        <button
          type="button"
          class="v-header-profile-pwa__overlay-close"
          aria-label="Close"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>
      <div class="v-header-profile-pwa__overlay-body">
        <div class="is--container">
          <div class="view-contact-us__wrap v-header-profile-pwa__overlay-content">
            <div class="v-header-profile-pwa__overlay-profile">
              <VAvatar
                size="large"
                :src="avatarSrc"
                alt="avatar image"
                class="v-header-profile-pwa__overlay-avatar"
              />
              <div class="v-header-profile-pwa__overlay-email is--h6__title">
                {{ email }}
              </div>
              <a
                v-if="accountDetailsHref"
                :href="accountDetailsHref"
                class="v-header-profile-pwa__overlay-link"
              >
                Account Details
              </a>
            </div>

            <div class="v-header-profile-pwa__overlay-list">
              <a
                v-if="mfaHref"
                :href="mfaHref"
                class="v-header-profile-pwa__overlay-item"
              >
                <UserIcon class="v-header-profile-pwa__overlay-icon" aria-hidden="true" />
                <span>MFA &amp; Password</span>
                <ArrowRight class="v-header-profile-pwa__overlay-chevron" aria-hidden="true" />
              </a>
              <a
                v-if="securityHref"
                :href="securityHref"
                class="v-header-profile-pwa__overlay-item"
              >
                <GearIcon class="v-header-profile-pwa__overlay-icon" aria-hidden="true" />
                <span>Account Security</span>
                <ArrowRight class="v-header-profile-pwa__overlay-chevron" aria-hidden="true" />
              </a>
              <a
                v-if="helpHref"
                :href="helpHref"
                class="v-header-profile-pwa__overlay-item"
              >
                <HelpIcon class="v-header-profile-pwa__overlay-icon" aria-hidden="true" />
                <span>Help Center</span>
                <ArrowRight class="v-header-profile-pwa__overlay-chevron" aria-hidden="true" />
              </a>
              <a
                v-if="contactHref"
                :href="contactHref"
                class="v-header-profile-pwa__overlay-item"
              >
                <FaqIcon class="v-header-profile-pwa__overlay-icon" aria-hidden="true" />
                <span>Contact Us</span>
                <ArrowRight class="v-header-profile-pwa__overlay-chevron" aria-hidden="true" />
              </a>
              <button
                type="button"
                class="v-header-profile-pwa__overlay-item v-header-profile-pwa__overlay-item--logout"
                @click="$emit('logout')"
              >
                <LogoutIcon class="v-header-profile-pwa__overlay-icon" aria-hidden="true" />
                <span>Log Out</span>
                <ArrowRight class="v-header-profile-pwa__overlay-chevron" aria-hidden="true" />
              </button>
            </div>
          </div>
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
    height: 56px;
    border-bottom: 1px solid $gray-20;
    display: flex;
    align-items: center;
  }

  &__overlay-body {
    flex: 1;
    overflow: auto;
  }

  &__overlay-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px 16px 24px;
    width: 100%;
    text-align: center;
    min-height: calc(100vh - 56px);
    justify-content: flex-start;
  }

  &__overlay-close {
    position: fixed;
    top: 12px;
    left: 12px;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 20px;
    background: transparent;
    color: $gray-80;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    z-index: 2;
  }

  &__overlay-avatar {
    margin-bottom: 4px;
  }

  &__overlay-email {
    color: $gray-80;
  }

  &__overlay-link {
    color: $primary;
    font-weight: 600;
    text-decoration: none;
    font-size: 14px;
  }

  &__overlay-list {
    width: 100%;
    margin-top: 24px;
    border-top: 1px solid $gray-20;
  }

  &__overlay-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 16px 4px;
    border-bottom: 1px solid $gray-20;
    text-decoration: none;
    color: inherit;
    background: transparent;
    border-left: none;
    border-right: none;
    border-top: none;
    cursor: pointer;
    font-size: 15px;
    font-weight: 600;
  }

  &__overlay-item--logout {
    color: $gray-90;
  }

  &__overlay-icon {
    width: 20px;
    height: 20px;
    color: $gray-80;
    flex-shrink: 0;
  }

  &__overlay-chevron {
    margin-left: auto;
    width: 16px;
    height: 16px;
    color: $gray-50;
  }
}

.view-contact-us {
  width: 100%;
  overflow: hidden;

  &__wrap {
    max-width: 753px;
    margin: 0 auto;
  }

  &__title {
    text-align: center;
    margin-bottom: 24px;
  }
}

.VHeaderProfileOverlayPWA .is--container {
  width: 100%;
  padding-left: 0;
  padding-right: 0;
}

.VHeaderProfileOverlayPWA .view-contact-us__wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: auto;
}
</style>
