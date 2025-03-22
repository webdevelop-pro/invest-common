<script setup lang="ts">
import {
  computed, defineAsyncComponent, hydrateOnVisible, PropType, ref, watchEffect,
} from 'vue';
import {
  ROUTE_FORGOT, ROUTE_LOGIN, ROUTE_SIGNUP,
} from 'InvestCommon/helpers/enums/routes';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { storeToRefs } from 'pinia';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import env from 'InvestCommon/global';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin, urlSignup } from 'InvestCommon/global/links';
import VHeader from 'UiKit/components/VHeader/VHeader.vue';

const VHeaderProfile = defineAsyncComponent({
  loader: () => import('./VHeaderProfile.vue'),

  hydrate: hydrateOnVisible(),
});

const VHeaderProfileMobile = defineAsyncComponent({
  loader: () => import('./VHeaderProfileMobile.vue'),

  hydrate: hydrateOnVisible(),
});

const VButton = defineAsyncComponent({
  loader: () => import('UiKit/components/Base/VButton/VButton.vue'),

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
  path: String,
});

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
const isMobileSidebarOpen = defineModel<boolean>();

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

// if there is flow in url it means it is from sso
let queryFlow;

const signInHandler = () => {
  navigateWithQueryParams(urlSignin, queryParams.value);
};

const signUpHandler = () => {
  navigateWithQueryParams(urlSignup, queryParams.value);
};

watchEffect(() => {
  path.value = props.path || '';
  queryFlow = (window && window.location.search) ? new URLSearchParams(window.location.search).get('flow') : null;
});
</script>

<template>
  <VHeader
    v-model="isMobileSidebarOpen"
    :show-navigation="!isSignInPage && !isSignUpPage && !isRecoveryPage"
    :path="path"
    class="VHeaderInvest v-header-invest"
  >
    <div class="v-header-invest__wrap">
      <span
        v-if="!queryFlow && !userLoggedIn && (isSignInPage || isRecoveryPage || isSignUpPage)"
        class="v-header-invest__auth-text is--body"
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
      </span>

      <VSkeleton
        v-if="isGetUserProfileLoading"
        height="25px"
        width="250px"
        class="v-header-invest-btns__skeleton"
      />
      <div
        v-else-if="!userLoggedIn"
        class="v-header-invest-btns"
        :class="{
          'v-header-invest-sign-in': isSignInPage,
          'v-header-invest-sign-up': isSignUpPage,
        }"
      >
        <VButton
          v-if="!queryFlow && !userLoggedIn && !isSignInPage && !isRecoveryPage"
          class="v-header-invest-btns__sign-in"
          :variant="!isSignUpPage ? 'link' : null"
          @click="signInHandler"
        >
          Log In
        </VButton>

        <VButton
          v-if="!queryFlow && !userLoggedIn && !isSignUpPage"
          class="v-header-invest-btns__sign-up"
          @click="signUpHandler"
        >
          Sign Up
        </VButton>
      </div>
      <VHeaderProfile
        v-else-if="userLoggedIn"
        :menu="profileMenu"
      />
    </div>

    <template #mobile>
      <div
        v-if="!userLoggedIn"
        class="v-header-invest-btns"
        :class="{
          'v-header-invest-sign-in': isSignInPage,
          'v-header-invest-sign-up': isSignUpPage,
        }"
      >
        <VButton
          v-if="!userLoggedIn && !isSignInPage && !isRecoveryPage"
          class="v-header-invest-btns__sign-in"
          :variant="!isSignUpPage ? 'link' : null"
          @click="signInHandler"
        >
          Log In
        </VButton>

        <VButton
          v-if="!userLoggedIn && !isSignUpPage"
          class="v-header-invest-btns__sign-up"
          @click="signUpHandler"
        >
          Sign Up
        </VButton>
      </div>
      <VHeaderProfileMobile
        v-else-if="userLoggedIn"
        :menu="profileMenu"
        @click="isMobileSidebarOpen = false"
      />
    </template>
  </VHeader>
</template>

<style lang="scss">
.v-header-invest {

  .is--container {
    max-width: 1280px;
  }

  &__wrap {
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .v-navigation-menu-link {
    height: $header-height;
    align-content: center;
    -webkit-align-content: center;
    display: flex;
    align-items: center;
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
      flex-direction: column;
    }

    &.wd-header-sign-in,
    &.wd-header-sign-up {
      @include media-lte(desktop-md) {
        display: block;
      }
    }
  }

  &__auth-text {
    color: $gray-80;
  }

}
  .v-header-mobile__list {
    border-top: none !important;
  }
</style>
