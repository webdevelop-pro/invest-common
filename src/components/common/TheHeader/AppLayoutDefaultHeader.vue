<script setup lang="ts">
import { computed, PropType, ref, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import TheLogo from 'UiKit/components/common/TheLogo/TheLogo.vue';
import AppMobileMenu from './AppMobileMenu.vue';
import AppLayoutDefaultHeaderProfile from './AppLayoutDefaultHeaderProfile.vue';
import BaseButton from 'UiKit/components/BaseButton/BaseButton.vue';
import {
  ROUTE_FORGOT, ROUTE_LOGIN, ROUTE_SIGNUP,
} from 'InvestCommon/helpers/enums/routes';
import AppLayoutDefaultHeaderNavigation from './AppLayoutDefaultHeaderNavigation.vue';
import { useAuthLogicStore, useUsersStore } from 'InvestCommon/store';
import { storeToRefs } from 'pinia';
import BaseSkeleton from 'UiKit/components/BaseSkeleton/BaseSkeleton.vue';
import env from 'InvestCommon/global';
import { navigateWithQueryParams } from 'InvestCommon/helpers/general';

const { EXTERNAL } = env;

type MenuItem = {
  to?: {
    name: string;
  };
  href?: string;
  text: string;
  children?: MenuItem[];
  path?: string;
}

const props = defineProps({
  profileMenu: Array as PropType<MenuItem[]>,
  menu: Array as PropType<MenuItem[]>,
  path: String,
})

const isMobileMenuOpen = ref(false);
const router = useRouter();
const usersStore = useUsersStore();
const { userLoggedIn, isGetUserIdentityLoading } = storeToRefs(usersStore);
const authLogicStore = useAuthLogicStore();
const { isLoadingSession } = storeToRefs(authLogicStore);
const path = ref(props.path || '');
const isSignUpPage = computed(() => {
  if (EXTERNAL) {
    return path.value.includes('signup');
  }
  return router.currentRoute.value.name === ROUTE_SIGNUP;
});
const isSignInPage = computed(() => {
  if (EXTERNAL) {
    return path.value.includes('signin');
  }
  return router.currentRoute.value.name === ROUTE_LOGIN
});
const isRecoveryPage = computed(() => {
  if (EXTERNAL) {
    return path.value.includes('forgot');
  }
  return router.currentRoute.value.name === ROUTE_FORGOT
});
const queryParams = computed(() => {
  if (EXTERNAL) {
    return new URLSearchParams(window.location.search);
  }
  return router.currentRoute.value.query;
})

const signInHandler = () => {
  if (EXTERNAL) {
    navigateWithQueryParams('/signin', { query: queryParams.value });
  } else {
    void router.push({ name: ROUTE_LOGIN, query: router.currentRoute.value.query });
  }
};

const signUpHandler = () => {
  if (EXTERNAL) {
    navigateWithQueryParams('/signup', { query: queryParams.value });
  } else {
    void router.push({ name: ROUTE_SIGNUP, query: router.currentRoute.value.query });
  }
};

const currentRoute = computed(() => {
  if (EXTERNAL) {
    return window?.location?.pathname
  }
  return router.currentRoute
})

watch([currentRoute.value], () => {
  isMobileMenuOpen.value = false;
});

watchEffect(() => {
  path.value = props.path || '';
});
</script>

<template>
  <div class="AppLayoutDefaultHeader app-layout-default-header is--no-margin">
    <div class="app-layout-default-header__logo-wrap">
      <TheLogo
        link="/"
        class="app-layout-default-header__logo"
      />
    </div>

    <div class="app-layout-default-header__right">
      <div class="app-layout-default-header__nav">
        <AppLayoutDefaultHeaderNavigation
          v-if="!isSignInPage && !isSignUpPage && !isRecoveryPage"
          :menu="menu"
        />
        <div
          v-else
          class="app-layout-default-header__auth-text is--body"
        >
          <span
            v-if="!userLoggedIn && !isSignInPage && !isRecoveryPage"
          >
            Already have an account?
          </span>
          <span
            v-if="!userLoggedIn && !isSignUpPage"
          >
            Don't have an account?
          </span>
        </div>


        <BaseSkeleton
          v-if="isGetUserIdentityLoading || isLoadingSession"
          height="25px"
          width="250px"
          class="app-layout-default-header-btns__skeleton"
        />
        <div
          v-else-if="!userLoggedIn"
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
        <AppLayoutDefaultHeaderProfile
          v-else-if="userLoggedIn"
          :menu="profileMenu"
          class="app-layout-default-header-btns__profile"
        />
      </div>


      <AppMobileMenu
        v-model="isMobileMenuOpen"
        :menu="menu"
        :profile-menu="profileMenu"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-layout-default-header {
  position: relative;
  z-index: 9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1280px;
  padding: 0 15px;
  margin: 0 auto;
  min-height: $wd-header-height;

  &__logo-wrap {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__logo {
    display: flex;
    align-items: center;
    max-width: 211px;
    margin-right: 55px;

    @include media-lte(desktop-lg) {
      max-width: 220px;
      margin-right: 30px;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    flex: 1;
  }

  &__nav {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 28px;
  }

  &__button {
    flex-shrink: 0;
    @include media-lte(desktop-md) {
      display: none !important;
    }
  }

  &-btns {
    display: flex;
    gap: 8px;
    flex-shrink: 0;

    &__sign-in,
    &__sign-up {
      flex-shrink: 0;
    }

    @include media-lte(desktop-md) {
      display: none;
    }

    &.wd-header-sign-in,
    &.wd-header-sign-up {
      @include media-lte(desktop-md) {
        display: block;
      }
    }

    &__profile {
      @include media-lte(desktop-md) {
        display: none;
      }
    }
  }

  &__auth-text {
    color: $gray-80;
  }
}
</style>
