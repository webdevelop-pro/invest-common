<script setup lang="ts">
import {
  computed, defineAsyncComponent, hydrateOnVisible, PropType, watchEffect,
} from 'vue';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { storeToRefs } from 'pinia';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin, urlSignup } from 'InvestCommon/domain/config/links';
import VHeader from 'UiKit/components/VHeader/VHeader.vue';
import { MenuItem } from 'InvestCommon/types/global'; // Use shared MenuItem type
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

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

const props = defineProps({
  profileMenu: Array as PropType<MenuItem[]>,
  path: {
    type: String,
    required: false,
    default: () => window?.location?.pathname || '',
  },
  isMobilePWA: {
    type: Boolean,
  },
});

const sessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(sessionStore);
const useRepositoryProfilesStore = useRepositoryProfiles();
const { getUserState } = storeToRefs(useRepositoryProfilesStore);
// Use props.path directly, no need for ref unless it is updated elsewhere
const isMobileSidebarOpen = defineModel<boolean>();

const isLoading = computed(() => getUserState.value.loading);
const isSignUpPage = computed(() => props.path?.includes('signup'));
const isSignInPage = computed(() => props.path?.includes('signin'));
const isRecoveryPage = computed(() => props.path?.includes('forgot'));
const isCheckEmailPage = computed(() => props.path?.includes('check-email'));
const isAuthenticatorPage = computed(() => props.path?.includes('authenticator'));
const isKYCBoPage = computed(() => props.path?.includes('kyc-bo'));

const isAuthFlowPage = computed(() => (isRecoveryPage.value || isCheckEmailPage.value));

const showNavigation = computed(() => (
  !isSignInPage.value && !isSignUpPage.value && !isRecoveryPage.value
  && !isCheckEmailPage.value && !isAuthenticatorPage.value && !isKYCBoPage.value));

const showAccountText = computed(() => (
  !queryFlow && !userLoggedIn.value && !showNavigation.value && !isAuthenticatorPage.value && !isKYCBoPage.value))
const showHaveAccount = computed(() => (!isSignInPage.value && !isAuthFlowPage.value))
const showDontHaveAccount = computed(() => (!isSignUpPage.value))
const showAuthButtons = computed(() => (
  !queryFlow && !userLoggedIn.value && !isAuthenticatorPage.value && !isKYCBoPage.value))


const queryParams = computed(() => new URLSearchParams(window?.location?.search));
// if there is flow in url it means it is from sso
let queryFlow: string | null = null; // Explicitly type queryFlow

const showMobileSidebar = computed(() => (
  showNavigation.value
));


const signInHandler = () => {
  // Convert URLSearchParams to Record<string, string>
  const paramsObj: Record<string, string> = {};
  queryParams.value.forEach((value, key) => {
    paramsObj[key] = value;
  });
  navigateWithQueryParams(urlSignin, paramsObj);
};

const signUpHandler = () => {
  const paramsObj: Record<string, string> = {};
  queryParams.value.forEach((value, key) => {
    paramsObj[key] = value;
  });
  navigateWithQueryParams(urlSignup, paramsObj);
};

watchEffect(() => {
  queryFlow = (window && window?.location?.search) ? new URLSearchParams(window.location.search).get('flow') : null;
});
</script>

<template>
  <VHeader
    v-model="isMobileSidebarOpen"
    :show-navigation="showNavigation"
    :show-mobile-sidebar="showMobileSidebar"
    class="VHeaderInvest v-header-invest"
  >
    <div class="v-header-invest__wrap">
      <span
        v-if="showAccountText"
        class="v-header-invest__auth-text is--body"
      >
        <span
          v-if="showHaveAccount"
        >
          Already have an account?
        </span>
        <span
          v-if="showDontHaveAccount"
        >
          Don't have an account?
        </span>
      </span>

      <VSkeleton
        v-if="isLoading"
        height="25px"
        width="250px"
        class="v-header-invest-btns__skeleton"
      />
      <div
        v-else-if="showAuthButtons"
        class="v-header-invest-btns"
        :class="{
          'v-header-invest-sign-in': isSignInPage,
          'v-header-invest-sign-up': isSignUpPage,
        }"
      >
        <VButton
          v-if="showHaveAccount"
          class="v-header-invest-btns__sign-in"
          :variant="!isSignUpPage ? 'link' : null"
          @click="signInHandler"
        >
          Log In
        </VButton>

        <VButton
          v-if="showDontHaveAccount"
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
        v-if="showAuthButtons"
        class="v-header-invest-btns"
        :class="{
          'v-header-invest-sign-in': isSignInPage,
          'v-header-invest-sign-up': isSignUpPage,
        }"
      >
        <VButton
          v-if="showHaveAccount"
          class="v-header-invest-btns__sign-in"
          :variant="!isSignUpPage ? 'link' : null"
          @click="signInHandler"
        >
          Log In
        </VButton>

        <VButton
          v-if="showDontHaveAccount"
          class="v-header-invest-btns__sign-up"
          @click="signUpHandler"
        >
          Sign Up
        </VButton>
      </div>
      <VHeaderProfileMobile
        v-else-if="userLoggedIn"
        :menu="profileMenu"
        :is-mobile-pwa="isMobilePWA"
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
    gap: 13px;
  }

  .v-navigation-menu-link {
    height: $header-height;
    align-content: center;
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
