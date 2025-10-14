<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { storeToRefs } from 'pinia';
import {
  VNavigationMenuList, VNavigationMenuItem, VNavigationMenuLink, VNavigationMenu,
} from 'UiKit/components/Base/VNavigationMenu';
import VAvatar from 'UiKit/components/VAvatar.vue';
import NotificationsSidebarButton from 'InvestCommon/features/notifications/VNotificationsSidebarButton.vue';
import env from 'InvestCommon/domain/config/env';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import LogOutIcon from 'UiKit/assets/images/menu_common/logout.svg';
import type { MenuItem } from 'InvestCommon/types/global';

const { IS_STATIC_SITE } = env;

defineProps({
  menu: Array as PropType<MenuItem[]>,
});

const emit = defineEmits(['click']);

const userSessionStore = useSessionStore();
const { userSessionTraits } = storeToRefs(userSessionStore);
const useDialogsStore = useDialogs();
const { isDialogLogoutOpen } = storeToRefs(useDialogsStore);

const userEmail = computed(() => userSessionTraits.value?.email);

const onClick = () => {
  emit('click');
};

const onLogout = () => {
  isDialogLogoutOpen.value = true;
  onClick();
};

const getComponentName = (item: MenuItem) => {
  if (item.to) return 'router-link';
  if (item.href) return 'a';
  return 'div';
};
</script>

<template>
  <VNavigationMenu
    orientation="vertical"
    class="VHeaderProfileMobile v-header-profile-mobile"
  >
    <VNavigationMenuList>
      <VNavigationMenuItem>
        <div class="is--h6__title">
          <VAvatar
            size="small"
            src=""
            alt="avatar image"
            class="v-header-profile-mobile__avatar"
          />
          {{ userEmail }}
        </div>
      </VNavigationMenuItem>
      <VNavigationMenuItem>
        <NotificationsSidebarButton
          :is-static-site="IS_STATIC_SITE"
          @click="onClick"
        />
      </VNavigationMenuItem>
      <VNavigationMenuItem
        v-for="(menuItem, index) in menu"
        :id="index"
        :key="JSON.stringify(menuItem)"
        @click="onClick"
      >
        <VNavigationMenuLink as-child>
          <component
            :is="getComponentName(menuItem)"
            :to="menuItem.to"
            :href="menuItem.href"
            :class="[
              'v-header-profile-mobile__menu-link',
              menuItem.class,
              { 'is-active': menuItem.active },
            ]"
          >
            <component
              :is="menuItem.icon"
              v-if="menuItem.icon"
              class="v-header-profile-mobile__icon"
              aria-hidden="true"
            />
            <span class="v-header-profile-mobile__label">
              {{ menuItem.text }}
            </span>
          </component>
        </VNavigationMenuLink>
      </VNavigationMenuItem>
      <VNavigationMenuItem
        data-testid="header-profile-logout"
        @click="onLogout"
      >
        <VNavigationMenuLink class="v-header-profile-mobile__menu-link">
          <LogOutIcon
            class="v-header-profile-mobile__icon"
            aria-hidden="true"
          />
          <span class="v-header-profile-mobile__label">
            Log Out
          </span>
        </VNavigationMenuLink>
      </VNavigationMenuItem>
    </VNavigationMenuList>
  </VNavigationMenu>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as colors;

.v-header-profile-mobile {
  $root: &;

  width: 100%;
  display: flex;
  align-items: center;
  gap: 28px;
  z-index: 0;
  flex-direction: column;

  .v-navigation-menu-list {
    gap: 18px;
  }

  .v-navigation-menu-item {
    width: 100%;
  }

  & > div {
    width: 100%;
  }

  &__menu-link {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 0;
    text-decoration: none;
    color: inherit;

    &.is-active {
      color: colors.$primary;
      font-weight: 600;
    }

    &.is--border-top {
      border-top: 1px solid colors.$gray-30;
      padding-top: 20px;
    }
  }

  &__icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: colors.$gray-50;
  }

  &__label {
    flex: 1;
  }

  &__avatar {
    margin-right: 5px;
    margin-left: -5px;
  }

  &__notification {
    position: relative;
    cursor: pointer;
  }

  &__notification-dot {
    width: 8px;
    height: 8px;
    position: absolute;
    right: -8px;
    top: -2px;
    background-color: colors.$white;
    border-radius: 100%;
    z-index: 0;

    &::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      right: 1px;
      top: 1px;
      background-color: colors.$primary;
      border-radius: 100%;
      z-index: 0;
    }
  }
}
</style>
