<script setup lang="ts">
import {
  computed, defineAsyncComponent, hydrateOnVisible, PropType, ref, watch, watchEffect,
} from 'vue';
import {
  ROUTE_FORGOT, ROUTE_LOGIN, ROUTE_SIGNUP,
} from 'InvestCommon/helpers/enums/routes';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { storeToRefs } from 'pinia';
import VSkeleton from 'UiKit/components/VSkeleton/VSkeleton.vue';
import env from 'InvestCommon/global';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin, urlSignup } from 'InvestCommon/global/links';


// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const TheLogo = defineAsyncComponent({
  loader: () => import('UiKit/components/VLogo/VLogo.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VMobileMenu = defineAsyncComponent({
  loader: () => import('./VMobileMenu.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VHeaderProfile = defineAsyncComponent({
  loader: () => import('./VHeaderProfile.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VHeaderNavigation = defineAsyncComponent({
  loader: () => import('./VHeaderNavigation.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const VButton = defineAsyncComponent({
  loader: () => import('UiKit/components/VButton/VButton.vue'),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  hydrate: hydrateOnVisible(),
});

const { EXTERNAL } = env;

type MenuItem = {
  to?: {
    name: string;
  };
  href?: string;
  active?: boolean;
  text: string;
  children?: MenuItem[];
  path?: string;
}

const props = defineProps({
  profileMenu: Array as PropType<MenuItem[]>,
  menu: Array as PropType<MenuItem[]>,
  path: String,
});

const isMobileMenuOpen = ref(false);
let router;
if (!EXTERNAL) {
  const { useRouter } = await import('vue-router');
  router = useRouter();
}

const usersStore = useUsersStore();
const { userLoggedIn, isGetUserProfileLoading } = storeToRefs(usersStore);
const authLogicStore = useAuthLogicStore();
const { isLoadingSession } = storeToRefs(authLogicStore);
const path = ref(props.path || '');

const isSignUpPage = computed(() => {
  if (EXTERNAL) {
    return path.value.includes('signup');
  }
  return router?.currentRoute.value.name === ROUTE_SIGNUP;
});

const isSignInPage = computed(() => {
  if (EXTERNAL) {
    return path.value.includes('signin');
  }
  return router?.currentRoute.value.name === ROUTE_LOGIN;
});

const isRecoveryPage = computed(() => {
  if (EXTERNAL) {
    return path.value.includes('forgot');
  }
  return router?.currentRoute.value.name === ROUTE_FORGOT;
});

const queryParams = computed(() => {
  if (EXTERNAL) {
    return new URLSearchParams(window.location.search);
  }
  return router?.currentRoute.value.query;
});

const signInHandler = () => {
  navigateWithQueryParams(urlSignin, queryParams.value);
};

const signUpHandler = () => {
  navigateWithQueryParams(urlSignup, queryParams.value);
};

const currentRoute = computed(() => {
  if (EXTERNAL) {
    return window?.location?.pathname;
  }
  return router?.currentRoute;
});

watch(() => currentRoute.value, () => {
  isMobileMenuOpen.value = false;
});

watchEffect(() => {
  path.value = props.path || '';
});
</script>

<template>
  <div class="VHeader v-header is--no-margin">
    <div class="v-header__logo-wrap">
      <TheLogo
        link="/"
        class="v-header__logo"
      />
    </div>

    <div class="v-header__right">
      <div class="v-header__nav">
        <VHeaderNavigation
          v-if="!isSignInPage && !isSignUpPage && !isRecoveryPage"
          :menu="menu"
        />
        <div
          v-else
          class="v-header__auth-text is--body"
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

        <VSkeleton
          v-if="isGetUserProfileLoading || isLoadingSession"
          height="25px"
          width="250px"
          class="v-header-btns__skeleton"
        />
        <div
          v-else-if="!userLoggedIn"
          class="v-header-btns"
          :class="{
            'v-header-sign-in': isSignInPage,
            'v-header-sign-up': isSignUpPage,
          }"
        >
          <VButton
            v-if="!userLoggedIn && !isSignInPage && !isRecoveryPage"
            class="v-header-btns__sign-in"
            :variant="!isSignUpPage ? 'link' : null"
            @click="signInHandler"
          >
            Log In
          </VButton>

          <VButton
            v-if="!userLoggedIn && !isSignUpPage"
            class="v-header-btns__sign-up"
            @click="signUpHandler"
          >
            Sign Up
          </VButton>
        </div>
        <VHeaderProfile
          v-else-if="userLoggedIn"
          :menu="profileMenu"
          class="v-header-btns__profile"
        />
      </div>

      <VMobileMenu
        v-model="isMobileMenuOpen"
        :menu="menu"
        :profile-menu="profileMenu"
      />
    </div>
  </div>
</template>

<style lang="scss">
.v-header {
  position: relative;
  z-index: 9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1280px;
  padding: 0 15px;
  margin: 0 auto;
  min-height: $header-height;

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
