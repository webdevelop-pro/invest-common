<script setup lang="ts">
import {
  watch, onMounted, onUnmounted, onBeforeUnmount, computed,
} from 'vue';
import { useBreakpointsStore, useUsersStore } from 'InvestCommon/store';
import { blockedBody } from 'InvestCommon/helpers/blocked-body';
import { MENU_HEADER_RIGHT } from '@/global/menu';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import {
  ROUTE_FORGOT, ROUTE_LOGIN, ROUTE_SIGNUP, ROUTE_DASHBOARD_PORTFOLIO,
  ROUTE_SETTINGS,
} from 'InvestCommon/helpers/enums/routes';
import BaseButton from 'UiKit/components/BaseButton/BaseButton.vue';
import AppMobileMenuBurger from './AppMobileMenuBurger.vue';
import { useLogoutModal } from 'InvestCommon/components/modals/modals';

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(['update:modelValue']);

const router = useRouter();
const usersStore = useUsersStore();
const { userLoggedIn, selectedUserProfileId, isGetUserIdentityLoading } = storeToRefs(usersStore);
const isSignUpPage = computed(() => router.currentRoute.value.name === ROUTE_SIGNUP);
const isSignInPage = computed(() => router.currentRoute.value.name === ROUTE_LOGIN);
const isRecoveryPage = computed(() => router.currentRoute.value.name === ROUTE_FORGOT);
const logoutModal = useLogoutModal();

const useVhHeight = () => {
  const setHeight = () => {
    const mobileMenuHeight = window.innerHeight * 0.01;
    document.documentElement.style.setProperty(
      '--vh',
      `${mobileMenuHeight}px`,
    );
  };

  onMounted(() => {
    setHeight();
    window.addEventListener('resize', setHeight);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', setHeight);
  });

  return setHeight;
};

const useBlockedBody = (
  close: () => void,
) => {
  const { isDesktopMD } = storeToRefs(useBreakpointsStore());

  let unBlockedBody: (() => void) | null = null;

  watch([isDesktopMD], () => {
    close();
  });

  watch(() => props.modelValue, () => {
    unBlockedBody?.();
    unBlockedBody = null;

    if (props.modelValue) {
      unBlockedBody = blockedBody();
    }
  });

  onBeforeUnmount(() => {
    unBlockedBody?.();
    unBlockedBody = null;
  });
};

const close = () => emit('update:modelValue', false);

void useBlockedBody(close);
void useVhHeight();

const getActive = (name: string) => {
  if (router.currentRoute.value.name === name) {
    return 'is--active';
  }
  return '';
};

const signInHandler = () => {
  void router.push({ name: ROUTE_LOGIN, query: router.currentRoute.value.query });
};

const signUpHandler = () => {
  void router.push({ name: ROUTE_SIGNUP, query: router.currentRoute.value.query });
};
const onLogout = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  void logoutModal.show({});
};
</script>

<template>
  <!-- eslint-disable vue/no-multiple-template-root -->
  <div
    class="AppMobileMenu wd-header-menu-bg"
    :class="{ 'is-active': modelValue }"
    @click="$emit('update:modelValue', false)"
  />

  <AppMobileMenuBurger
    :model-value="modelValue"
    class="wd-header-burger"
    @update:model-value="$emit('update:modelValue', !modelValue)"
  />

  <div
    class="wd-mobile-menu"
    :class="{ 'is-active': modelValue }"
  >
    <div class="wd-mobile-menu__list">
      <div
        v-for="menuItem in MENU_HEADER_RIGHT"
        :key="menuItem.text"
        class="wd-mobile-menu__item-wrap"
      >
        <router-link
          :to="{ name: menuItem.name }"
          class="wd-mobile-menu__item is--h5__title"
        >
          {{ menuItem.text }}
        </router-link>
        <div
          v-if="menuItem.children && menuItem.children.length > 0"
          class="wd-mobile-menu__children"
          :class="{ 'is--two-col': menuItem.children.length > 8 }"
        >
          <template
            v-for="childItem in menuItem.children"
            :key="childItem.text"
          >
            <router-link
              v-if="childItem.name"
              :to="{ name: childItem.name }"
              :class="getActive(childItem.name)"
              class="wd-mobile-menu__item is--h6__title"
            >
              {{ childItem.text }}
            </router-link>
          </template>
        </div>
      </div>
      <div
        v-if="!userLoggedIn"
        class="app-layout-default-header-btns"
        :class="{
          'app-layout-default-header-sign-in': isSignInPage,
          'app-layout-default-header-sign-up': isSignUpPage,
        }"
      >
        <BaseButton
          v-if="!userLoggedIn && !isSignInPage && !isRecoveryPage"
          class="app-layout-default-header-btns__sign-in"
          :variant="!isSignUpPage ? 'link' : null"
          @click="signInHandler"
        >
          Log In
        </BaseButton>

        <BaseButton
          v-if="!userLoggedIn && !isSignUpPage"
          class="app-layout-default-header-btns__sign-up"
          @click="signUpHandler"
        >
          Sign Up
        </BaseButton>
      </div>
      <div
        v-if="userLoggedIn && !isGetUserIdentityLoading"
        class="wd-mobile-menu__item-wrap"
      >
        <router-link
          v-if="selectedUserProfileId"
          :to="{ name: ROUTE_DASHBOARD_PORTFOLIO, params: { profileId: selectedUserProfileId } }"
          class="wd-mobile-menu__item is--h5__title"
        >
          Dashboard
        </router-link>
        <router-link
          :to="{ name: ROUTE_SETTINGS }"
          class="wd-mobile-menu__item is--h5__title"
        >
          Settings
        </router-link>
        <div
          class="wd-mobile-menu__item is--h5__title"
          data-testid="header-profile-logout"
          @click="onLogout"
        >
          Log Out
        </div>
      </div>
    </div>
    <div class="wd-mobile-menu__button-wrap" />
  </div>
</template>

<style lang="scss" scoped>
$z-index-menu-bg: 99;
$z-index-menu: 999;
$z-index-menu-burger: $z-index-menu + 1;

.wd-header-menu-bg,
.wd-header-burger,
.wd-mobile-menu {
  @include media-gt(desktop-md) {
    display: none !important;
  }
}

.wd-header-menu-bg {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: $z-index-menu-bg;
  width: 100%;
  height: 100%;
  visibility: hidden;
  background: rgba(0, 0, 0, 0.33);
  opacity: 0;
  transition: 0.3s;

  &.is-active {
    visibility: visible;
    opacity: 1;
  }
}

.wd-mobile-menu {
  $root: &;


  position: fixed;
  top: 0;
  right: 0;
  z-index: $z-index-menu;
  display: flex;
  flex-direction: column;
  max-width: 367px;
  width: 100%;
  height: 100vh;
  margin-right: 0;
  overflow-y: auto;
  background: $white;
  opacity: 0;
  transition: opacity 0.3s, transform 0.3s;
  transform: translateX(110%);

  &.is-active {
    opacity: 1;
    transform: translateX(0);
  }

  &__list {
    padding-top: 40px;
  }

  &__item-wrap {
    & + & {
      border-top: 1px solid $gray-40;
    }
    &:last-of-type {
      border-bottom: 1px solid $gray-40;
      padding-bottom: 8px;
    }
  }

  &__item {
    padding: 20px 0 12px 20px;
    width: 100%;
    color: $black;
    white-space: nowrap;
    display: block;
    &:hover {
      color: $primary;
    }
    &.is--active {
      color: $primary;
    }
  }

  &__children {
    width: 100%;
    cursor: pointer;
    overflow: hidden;
    padding: 0 8px 12px 20px;
    transition: 0.1s all ease;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;

    &.is--two-col {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }

    #{$root}__item {
      padding: 8px 12px;
      flex: 0 0 1;
    }
  }

  &__button-wrap {
    padding: 20px;
    width: 100%;
  }

  &__header-wrapper {
    padding-right: 21px;
    background: #152c76;
  }

  &__divider {
    width: 100%;
    margin-right: 15px;
    border-top: 2px solid #2244a8;
  }

  &__btn {
    & + & {
      margin-top: 18px;
    }
  }

  &__arrow {
    height: 15px;
  }
}

.wd-header-burger {
  margin-left: 19px;
}
</style>
