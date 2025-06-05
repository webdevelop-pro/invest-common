<script setup lang="ts">
import {
  computed, defineAsyncComponent, hydrateOnVisible, PropType, ref, watchEffect,
} from 'vue';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { storeToRefs } from 'pinia';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin, urlSignup } from 'InvestCommon/global/links';
import VHeader from 'UiKit/components/VHeader/VHeader.vue';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';

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

const sessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(sessionStore);
const userProfilesStore = useUserProfilesStore();
const { isGetUserLoading } = storeToRefs(userProfilesStore);
const path = ref(props.path || '');
const isMobileSidebarOpen = defineModel<boolean>();

const isLoading = computed(() => isGetUserLoading.value);
const isSignUpPage = computed(() => path.value.includes('signup'));
const isSignInPage = computed(() => path.value.includes('signin'));
const isRecoveryPage = computed(() => path.value.includes('forgot'));
const queryParams = computed(() => new URLSearchParams(window?.location?.search));
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
  queryFlow = (window && window?.location?.search) ? new URLSearchParams(window.location.search).get('flow') : null;
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
        v-if="isLoading"
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
    gap: 13px;
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
