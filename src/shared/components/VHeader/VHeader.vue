<script setup lang="ts">
import {
  computed, defineAsyncComponent, hydrateOnVisible, onMounted, PropType, ref,
} from 'vue';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { storeToRefs } from 'pinia';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin, urlSignup } from 'InvestCommon/domain/config/links';
import VHeader from 'UiKit/components/VHeader/VHeader.vue';
import { MenuItem } from 'InvestCommon/types/global'; // Use shared MenuItem type
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';
import ArrowRight from 'UiKit/assets/images/arrow-right.svg';

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
    default: '',
  },
  isMobilePWA: {
    type: Boolean,
    default: false,
  },
  showProfileLink: {
    type: Boolean,
    default: false,
  },
  urlProfile: {
    type: [String, Function] as PropType<string | (() => string)>,
    default: '',
  },
  layout: {
    type: String,
    default: '',
  },
  showPwaHomeLoginLink: {
    type: Boolean,
    default: false,
  },
});

const runtimePath = ref('');
onMounted(() => {
  runtimePath.value = window.location.pathname;
});


const { isDesktopMD } = storeToRefs(useBreakpoints());

const sessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(sessionStore);
const useRepositoryProfilesStore = useRepositoryProfiles();
const { getUserState } = storeToRefs(useRepositoryProfilesStore);
// Use props.path directly, no need for ref unless it is updated elsewhere
const isMobileSidebarOpen = defineModel<boolean>();

const resolvedPath = computed(() => props.path || runtimePath.value);

const isLoading = computed(() => getUserState.value.loading);
const isSignUpPage = computed(() => props.layout === 'auth-signup' || resolvedPath.value?.includes('signup'));
const isSignInPage = computed(() => props.layout === 'auth-login' || resolvedPath.value?.includes('signin'));
const isRecoveryPage = computed(() => props.layout === 'auth-forgot' || resolvedPath.value?.includes('forgot'));
const isCheckEmailPage = computed(() => props.layout === 'auth-check-email' || resolvedPath.value?.includes('check-email'));
const isAuthenticatorPage = computed(() => props.layout === 'auth-authenticator' || resolvedPath.value?.includes('authenticator'));
const isKYCBoPage = computed(() => props.layout?.includes('kyc-bo') || resolvedPath.value?.includes('kyc-bo'));
const isHomePage = computed(() => (
  props.layout === 'home'
  || resolvedPath.value === '/'
  || resolvedPath.value === '/index'
));

const isAuthFlowPage = computed(() => (isRecoveryPage.value || isCheckEmailPage.value));

const showNavigation = computed(() => (
  !isSignInPage.value && !isSignUpPage.value && !isRecoveryPage.value
  && !isCheckEmailPage.value && !isAuthenticatorPage.value && !isKYCBoPage.value));

const showAccountText = computed(() => (
  !userLoggedIn.value && !showNavigation.value && !isAuthenticatorPage.value && !isKYCBoPage.value))
const showHaveAccount = computed(() => (!isSignInPage.value && !isAuthFlowPage.value));
const showDontHaveAccount = computed(() => (!isSignUpPage.value));
const showAuthButtons = computed(() => (
  !userLoggedIn.value && !isAuthenticatorPage.value && !isKYCBoPage.value))
const showPwaLoginLink = computed(() => (
  (props.showPwaHomeLoginLink || (props.isMobilePWA && isHomePage.value))
  && !userLoggedIn.value
  && !isAuthenticatorPage.value
  && !isKYCBoPage.value
));
const showPwaAuthCta = computed(() => (
  !props.showPwaHomeLoginLink
  && !userLoggedIn.value
  && (isSignInPage.value || isSignUpPage.value)
));


const queryParams = computed(() => new URLSearchParams(window?.location?.search));

const showMobileSidebar = computed(() => showNavigation.value);


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

</script>

<template>
  <VHeader
    v-model="isMobileSidebarOpen"
    :show-navigation="showNavigation"
    :show-mobile-sidebar="showMobileSidebar"
    :is-mobile-p-w-a="isMobilePWA"
    :show-profile-link="showProfileLink"
    :url-profile="urlProfile"
    :user-logged-in="userLoggedIn"
    class="VHeaderInvest v-header-invest"
  >
    <div class="v-header-invest__wrap">
      <template v-if="showAccountText && !isMobilePWA">
        <span class="v-header-invest__auth-text is--body">
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
      </template>

      <VSkeleton
        v-if="isLoading"
        height="25px"
        width="250px"
        class="v-header-invest-btns__skeleton"
      />
      <div
        v-else-if="showAuthButtons && !isMobilePWA"
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
        :is-mobile-pwa="isMobilePWA"
        :is-desktop="isDesktopMD"
      />
    </div>

    <template #pwa>
      <button
        v-if="showPwaLoginLink"
        type="button"
        class="v-header-invest__pwa-login"
        @click="signInHandler"
      >
        <span>Log in</span>
        <component
          :is="ArrowRight"
          class="v-header-invest__pwa-login-icon"
        />
      </button>
      <div
        v-else-if="showPwaAuthCta"
        class="v-header-invest__pwa-auth"
      >
        <span class="v-header-invest__pwa-auth-text">
          <template v-if="isSignInPage">
            Don't have an account?
          </template>
          <template v-else-if="isSignUpPage">
            Already have an account?
          </template>
        </span>
        <VButton
          size="medium"
          class="v-header-invest__pwa-auth-btn"
          :class="{ 'is--secondary': isSignInPage }"
          @click="isSignInPage ? signUpHandler() : signInHandler()"
        >
          {{ isSignInPage ? 'Sign Up' : 'Log In' }}
        </VButton>
      </div>
    </template>

    <template #mobile>
      <div
        v-if="showAuthButtons && !isMobilePWA"
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
    font-size: 14px;
    line-height: 20px;
  }

  &__pwa-login {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: transparent;
    padding: 0;
    color: $primary;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    cursor: pointer;
  }

  &__pwa-login-icon {
    width: 16px;
    height: 16px;
  }

  &__pwa-auth {
    display: flex;
    align-items: center;
    gap: 12px;
    color: $gray-80;
  }

  &__pwa-auth-text {
    font-size: 14px;
    line-height: 20px;
  }

  &__pwa-auth-btn {
    flex-shrink: 0;
  }

}

  .v-header-mobile__list {
    border-top: none !important;
  }
</style>
