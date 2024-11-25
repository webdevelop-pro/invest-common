<script setup lang="ts">
import {
  watch, onMounted, onUnmounted, onBeforeUnmount, computed,
  PropType, ref,
} from 'vue';
import { useBreakpointsStore } from 'InvestCommon/store/useBreakpoints';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { blockedBody } from 'InvestCommon/helpers/blocked-body';
import { storeToRefs } from 'pinia';
import {
  ROUTE_FORGOT, ROUTE_LOGIN, ROUTE_SIGNUP,
} from 'InvestCommon/helpers/enums/routes';
import VButton from 'UiKit/components/VButton/VButton.vue';
import VMobileMenuBurger from './VMobileMenuBurger.vue';
import { useLogoutModal } from 'InvestCommon/components/modals/modals';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import env from 'InvestCommon/global';
import { urlSignin, urlSignup } from 'InvestCommon/global/links';

const { EXTERNAL } = env;

type MenuItem = {
  to?: {
    name: string;
  };
  href?: string;
  text: string;
  active?: boolean;
  children?: MenuItem[];
}

const props = defineProps({
  modelValue: Boolean,
  menu: Array as PropType<MenuItem[]>,
  profileMenu: Array as PropType<MenuItem[]>,
});

const emit = defineEmits(['update:modelValue']);

let router;
if (!EXTERNAL) {
  const { useRouter } = await import('vue-router');
  router = useRouter();
}
const usersStore = useUsersStore();
const { userLoggedIn, isGetUserProfileLoading } = storeToRefs(usersStore);
const path = ref(window?.location?.pathname);


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
  return router.currentRoute.value.name === ROUTE_LOGIN;
});
const isRecoveryPage = computed(() => {
  if (EXTERNAL) {
    return path.value.includes('forgot');
  }
  return router.currentRoute.value.name === ROUTE_FORGOT;
});
const queryParams = computed(() => {
  if (EXTERNAL) {
    return new URLSearchParams(window?.location?.search);
  }
  return router.currentRoute.value.query;
})

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

const signInHandler = () => {
  navigateWithQueryParams(urlSignin, queryParams.value);
};

const signUpHandler = () => {
  navigateWithQueryParams(urlSignup, queryParams.value);
};
const onLogout = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  void logoutModal.show({});
};


const getComponentName = (item: MenuItem) => {
  if (item.to) return 'router-link';
  if (item.href) return 'a';
  return 'div';
};
const getComponentClass = (item: MenuItem) => {
  if (item.to || item.href) return 'wd-mobile-menu__item';
  return 'wd-mobile-menu__item-not-link';
};

if (window) {
  watch(() => window?.location?.pathname, () => {
    path.value = window?.location?.pathname;
  })
}
</script>

<template>
  <!-- eslint-disable vue/no-multiple-template-root -->
  <div
    class="AppMobileMenu wd-header-menu-bg"
    :class="{ 'is-active': modelValue }"
    @click="$emit('update:modelValue', false)"
  />

  <VMobileMenuBurger
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
        v-for="menuItem in menu"
        :key="menuItem.text"
        class="wd-mobile-menu__item-wrap"
      >
        <component
          :is="getComponentName(menuItem)"
          :href="menuItem.href"
          :to="menuItem.to"
          class="is--h5__title"
          :class="[getComponentClass(menuItem), { 'is--active': menuItem.active }]"
        >
          {{ menuItem.text }}
        </component>
        <div
          v-if="menuItem.children && menuItem.children.length > 0"
          class="wd-mobile-menu__children"
          :class="{ 'is--two-col': menuItem.children.length > 8 }"
        >
          <template
            v-for="childItem in menuItem.children"
            :key="childItem.text"
          >
            <component
              :is="getComponentName(childItem)"
              :href="childItem.href"
              :to="childItem.to"
              class="is--h5__title"
              :class="[getComponentClass(childItem), { 'is--active': childItem.active }]"
            >
              {{ childItem.text }}
            </component>
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
        <VButton
          v-if="!userLoggedIn && !isSignInPage && !isRecoveryPage"
          class="app-layout-default-header-btns__sign-in"
          :variant="!isSignUpPage ? 'link' : null"
          @click="signInHandler"
        >
          Log In
        </VButton>

        <VButton
          v-if="!userLoggedIn && !isSignUpPage"
          class="app-layout-default-header-btns__sign-up"
          @click="signUpHandler"
        >
          Sign Up
        </VButton>
      </div>
      <div
        v-if="userLoggedIn && !isGetUserProfileLoading"
        class="wd-mobile-menu__item-wrap"
      >
        <template
          v-for="menuItem in profileMenu"
          :key="menuItem.text"
        >
          <component
              :is="getComponentName(menuItem)"
              :href="menuItem.href"
              :to="menuItem.to"
              class="is--h5__title"
              :class="[getComponentClass(menuItem), { 'is--active': menuItem.active }]"
          >
              {{ menuItem.text }}
          </component>
        </template>
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

<style lang="scss">
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
