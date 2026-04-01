<script setup lang="ts">
import {
  computed, defineAsyncComponent, hydrateOnVisible, PropType,
} from 'vue';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { storeToRefs } from 'pinia';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import {
  urlSignin,
  urlSignup,
} from 'InvestCommon/domain/config/links';
import VHeaderAuthorized from 'UiKit/components/VHeader/VHeaderAuthorized.vue';
import VHeaderGuest from 'UiKit/components/VHeader/VHeaderGuest.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { MenuItem } from 'InvestCommon/types/global'; // Use shared MenuItem type
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';

const VHeaderProfile = defineAsyncComponent({
  loader: () => import('./VHeaderProfile.vue'),
  hydrate: hydrateOnVisible(),
});
const VHeaderProfileMobile = defineAsyncComponent({
  loader: () => import('./VHeaderProfileMobile.vue'),
  hydrate: hydrateOnVisible(),
});
const props = defineProps({
  profileMenu: Array as PropType<MenuItem[]>,
  // Header navigation menu (e.g. Explore, How It Works, etc.)
  menu: Array as PropType<MenuItem[]>,
  mobileMenu: Array as PropType<MenuItem[]>,
  path: {
    type: String,
    default: '',
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
});

const { isDesktopMD } = useBreakpoints();

const sessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(sessionStore);
const useRepositoryProfilesStore = useRepositoryProfiles();
const { getUserState } = storeToRefs(useRepositoryProfilesStore);

const isMobileSidebarOpen = defineModel<boolean>({ default: false });

const resolvedPath = computed(() => {
  if (props.path) {
    return props.path;
  }

  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }

  return '';
});

const isSignUpPage = computed(
  () => props.layout === 'auth-signup' || resolvedPath.value?.includes('signup'),
);
const isSignInPage = computed(
  () => props.layout === 'auth-login' || resolvedPath.value?.includes('signin'),
);
const isRecoveryPage = computed(
  () => props.layout === 'auth-forgot' || resolvedPath.value?.includes('forgot'),
);
const isCheckEmailPage = computed(
  () => props.layout === 'auth-check-email' || resolvedPath.value?.includes('check-email'),
);
const isAuthenticatorPage = computed(
  () => props.layout === 'auth-authenticator' || resolvedPath.value?.includes('authenticator'),
);
const isKYCBoPage = computed(
  () => props.layout?.includes('kyc-bo') || resolvedPath.value?.includes('kyc-bo'),
);

const isAuthFlowPage = computed(
  () => isRecoveryPage.value || isCheckEmailPage.value,
);

const showNavigation = computed(
  () => !isSignInPage.value
    && !isSignUpPage.value
    && !isRecoveryPage.value
    && !isCheckEmailPage.value
    && !isAuthenticatorPage.value
    && !isKYCBoPage.value,
);

const isLoading = computed(() => getUserState.value.loading);

const desktopMenu = computed(() => (
  isDesktopMD.value || !userLoggedIn.value ? props.menu : []
));

const showAccountText = computed(
  () => !userLoggedIn.value
    && !showNavigation.value
    && !isAuthenticatorPage.value
    && !isKYCBoPage.value,
);

const showHaveAccount = computed(
  () => !isSignInPage.value && !isAuthFlowPage.value,
);

const showDontHaveAccount = computed(
  () => !isSignUpPage.value,
);

const showAuthButtons = computed(
  () => !userLoggedIn.value && !isAuthenticatorPage.value && !isKYCBoPage.value,
);
const headerComponent = computed(() => (
  userLoggedIn.value ? VHeaderAuthorized : VHeaderGuest
));

const buildQueryParamsObject = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {};
  }

  const search = window.location.search ?? '';
  const params = new URLSearchParams(search);
  const paramsObj: Record<string, string> = {};

  params.forEach((value, key) => {
    paramsObj[key] = value;
  });

  return paramsObj;
};

const signInHandler = () => {
  navigateWithQueryParams(urlSignin, buildQueryParamsObject());
};

const signUpHandler = () => {
  navigateWithQueryParams(urlSignup, buildQueryParamsObject());
};

</script>

<template>
  <component
    :is="headerComponent"
    v-model="isMobileSidebarOpen"
    :show-navigation="showNavigation"
    :show-mobile-sidebar="showNavigation"
    :menu="desktopMenu"
    :is-mobile-p-w-a="false"
    :show-profile-link="showProfileLink"
    :url-profile="urlProfile"
    :user-logged-in="userLoggedIn"
    class="VHeaderInvest v-header-invest"
  >
    <template
      v-if="$slots.leading"
      #leading
    >
      <slot name="leading" />
    </template>

    <div class="v-header-invest__wrap">
      <template v-if="showAccountText">
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
          :variant="!isSignUpPage ? 'link' : undefined"
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
        :is-mobile-pwa="false"
        :is-desktop="isDesktopMD"
        show-logout-icon
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
          :variant="!isSignUpPage ? 'link' : undefined"
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
        :menu="mobileMenu"
        :is-mobile-pwa="false"
        @click="isMobileSidebarOpen = false"
      />
    </template>
  </component>
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

    @media screen and (width < $desktop-md){
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
    padding: 4px 8px;
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

  &__pwa-logout {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    padding: 0;
    color: $gray-80;
    cursor: pointer;
  }

  &__pwa-logout-icon {
    width: 20px;
    height: 20px;
  }

  &__pwa-back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    padding: 0;
    color: $gray-80;
    cursor: pointer;
  }

  &__pwa-back-icon {
    width: 20px;
    height: 20px;
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
